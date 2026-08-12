/**
 * Decisions in depth — two buckets in one file, because the same file had to
 * deepen the two Paths that were thinnest per topic: Strategist (11 topics
 * carrying 47 questions) and Human Insight (10 topics carrying 49). No new
 * skills are introduced here; every template lands on a skill that already
 * exists, and `bucket` is set per template to match that skill's own bucket.
 *
 * WHAT IS NEW, AND WHY IT IS NOT A REPEAT.
 *
 * - `st-decomp` gains the two moves the existing Backward Plan does not test:
 *   which task can START right now given what already exists, and how much
 *   runway a serial chain needs before a fixed date. `strat-critical-path`
 *   already owns the parallel case (two tasks at once cost the longer, not the
 *   sum); `dd-runway` deliberately owns the serial case, where slack can be
 *   NEGATIVE and the honest answer is that the plan does not fit.
 *
 * - `st-estimate` gains real arithmetic on the learner's own record: overrun
 *   ratios averaged into a correction factor, two forecasters scored by total
 *   absolute error, an interval hit-rate read against the confidence claimed,
 *   and a median of five past actuals used instead of a mean an outlier drags.
 *   The existing estimation item is an MCQ about the planning fallacy; nothing
 *   in the bank made the learner compute their own correction factor.
 *
 * - `st-ev` gains the case the brief calls for explicitly: a NEEDED threshold
 *   overruling expected value because there is exactly one attempt. Half the
 *   variants of `dd-ev-need` are built so the certain route already clears the
 *   bar (take it, even though the gamble has the higher average) and half so it
 *   cannot (take the gamble, even though its average is lower). A bank where
 *   the cautious option is always right teaches caution, not decision-making.
 *
 * - `st-tradeoff`, `st-reversible`, `st-secondorder` and `st-sunk` get one
 *   template each, chosen to be structurally disjoint from `items/choiceLab.ts`
 *   rather than merely differently worded: the deal-breaker that a weighted
 *   score hides (choiceLab names this as a limitation and does not train it),
 *   the return window that closes BEFORE the deciding information arrives,
 *   displacement in settings choiceLab does not use, and finish-A-versus-
 *   switch-to-B, where both futures still cost money and the sunk figure is
 *   irrelevant to both.
 *
 * HONESTY, WHERE IT COSTS SOMETHING.
 *
 * The pre-mortem items are written against their own evidence rather than
 * around it. Mitchell, Russo & Pennington (1989, J. Behavioral Decision Making
 * 2(1), 25-38) is the source of the widely quoted "about 30% more reasons"
 * figure, and it counted the NUMBER of reasons generated under prospective
 * hindsight, not their quality or their effect on any decision. The only
 * quantitative test of the group exercise as practised is Veinott, Klein &
 * Wiggins (2010, ISCRAM conference paper, 178 students), which found reduced
 * confidence. So `dd-pre-claim` makes the overclaim the DISTRACTOR and the
 * honest reading the key: the exercise surfaces more failure modes and lowers
 * confidence in a lab, and no study shows it improves real decisions. Nothing
 * in this file says otherwise.
 *
 * SAFETY — this is the most constrained file in the app.
 *
 * Human Insight here is influence DEFENCE and nothing else. Every h-influence
 * item asks the learner to RECOGNISE a tactic or REFUSE it; none contains an
 * operational instruction in applying pressure, extracting information,
 * profiling anyone, or reading a person for advantage, and no item anywhere
 * treats a "tell" as evidence of lying. Scenarios stay at ordinary school,
 * club and family friction on purpose. `dd-bnd-escalate` asks who a situation
 * belongs to using only ordinary friction — a marking error, money owed, a
 * broken window, a rumour — and carries the two non-negotiable cases (anything
 * where someone could be hurt, and any adult or near-stranger asking a young
 * person to keep secrets from their parents) as a plain statement in the
 * explanation that BREAKS the exercise frame, points at a trusted adult, and
 * names 988 in the US. Those are never the puzzle. Strategy content rewards
 * wins that survive daylight: `dd-eth-daylight` and `dd-eth-agency` make the
 * honest route the winning route on its merits, and no deception appears as a
 * technique anywhere.
 *
 * OPTION LENGTH, which is the rule this file was most likely to break, and the
 * numbers it was measured at. Both buckets are prose-option buckets: the
 * correct answer naturally wants a qualifying clause and the failures naturally
 * come out clipped, which is the exact shape that once let a learner score
 * 52.8% bank-wide by always choosing the longest option.
 *
 * Measured over all 322 MCQ option sets this file renders, against a 25.0%
 * guessing baseline:
 *
 *   - "always pick the longest option"        0.0%  (the key is never strictly
 *                                                    the longest, anywhere)
 *   - "always pick the second-shortest"      33.9%
 *
 * The second figure is the honest residual and it is close to its floor. Once
 * the longest option can never be the key, a positional guesser is choosing
 * among three ranks rather than four, so 33.3% is the best achievable, and the
 * key's rank is spread deliberately across those three: every family with a
 * meaningful length spread puts the key at two or more different ranks across
 * its variants. Where the key is the shortest option it is shorter by a handful
 * of characters, never by a visible margin — the self-check that produced these
 * numbers asserted both directions and a 10-character floor on the gap.
 *
 * In the refusal, boundary and apology items the failures are written out at
 * full length on purpose. A self-justifying no that rambles for three lines is
 * what a real bad one looks like, and clipping those to flatten a statistic
 * would make them easy to spot for a different reason.
 *
 * Every numeric answer is COMPUTED from the generated values and every fixed
 * bank is indexed with `cycle` so the declared variant count is honest.
 */
import type { ItemTemplate } from '../../domain/types'
import { classify, cycle, mcq, mcqNoted, money, multi, numeric, round, tpl } from '../lib'
import { rint, shuffle } from '../../engine/rng'

const STRAT = 'strategist' as const
const INSIGHT = 'insight' as const

/** A fixed scene with one key and three same-shape distractors. */
interface Choice {
  scene: string
  correct: string
  wrong: [string, string, string]
  /** Why the most tempting wrong option tempts. Required in every explanation. */
  tempt: string
}

// ===========================================================================
// st-decomp — backward planning, and the step that cannot start yet
// ===========================================================================

interface PlanCase {
  goal: string
  /** In the order that actually works. */
  steps: string[]
  note: string
}

const ORDER_CASES: PlanCase[] = [
  {
    goal: 'A working bird feeder on the balcony rail by Sunday.',
    steps: [
      'Measure the balcony rail at its widest point',
      'Buy a bracket that fits the measurement you took',
      'Fit the bracket to the rail',
      'Hang the feeder from the fitted bracket',
      'Fill it, and check two days later whether birds found it',
    ],
    note: 'Buying before measuring is the classic inversion: the bracket is chosen from a number that does not exist yet, so half the time it comes back to the shop.',
  },
  {
    goal: 'A photograph accepted into the town exhibition, entries closing on the 14th.',
    steps: [
      'Read the entry rules for size, format and framing',
      'Choose one photograph that those rules allow',
      'Order the print at the size the rules specify',
      'Mount the print once it arrives',
      'Deliver the mounted print before the 14th',
    ],
    note: 'The rules come first because they narrow everything after them. Choosing the photograph first feels like the creative start and routinely produces a picture the size rules disqualify.',
  },
  {
    goal: 'Hand-made cards on a table at the winter market.',
    steps: [
      'Book a table and ask how wide it is',
      'Work out how many cards that width can hold',
      'Buy card and envelopes for that number',
      'Make the cards and write the prices up',
      'Set the table out on market morning',
    ],
    note: 'The table width is the constraint everything downstream is sized from. Making cards first is the enjoyable step, and it is the one that produces either a crowded table or wasted card.',
  },
  {
    goal: 'One podcast episode published.',
    steps: [
      'Agree the topic with the person you are interviewing',
      'Write the questions from the agreed topic',
      'Record the interview using those questions',
      'Cut the recording down to length',
      'Publish the finished episode',
    ],
    note: 'Each step here eats the previous step\'s output, which is what makes the order forced rather than a matter of taste. Questions written before the topic is agreed get thrown away.',
  },
  {
    goal: 'Tomatoes to eat in August.',
    steps: [
      'Sow the seeds indoors in March',
      'Pot the seedlings on once they have four leaves',
      'Plant them outside after the last frost',
      'Water and tie them in through the summer',
      'Pick the fruit as it ripens',
    ],
    note: 'The calendar sets this one, not you. Working backwards from August is the only way to notice that the first move has to happen in March, which is the sort of deadline that arrives before anyone feels ready.',
  },
  {
    goal: 'A second-hand uniform swap running at the end of term.',
    steps: [
      'Get permission to use the hall on the day',
      'Announce the swap and ask for donations',
      'Sort the donated items into sizes',
      'Lay the sorted items out that morning',
      'Run the swap and box up what is left',
    ],
    note: 'Announcing before the hall is booked is the step people take first because it is the exciting one, and it is the one that creates a promise the plan may not be able to keep.',
  },
  {
    goal: 'A bike that is safe to ride to school on the first day of term.',
    steps: [
      'Check the bike over and list what is wrong',
      'Price the parts on that list',
      'Order the parts you have decided to buy',
      'Fit the parts when they arrive',
      'Ride a test route before term starts',
    ],
    note: 'The test ride is the step that gets dropped, and it is the only one that would catch a part fitted wrongly. A plan whose last check happens on the morning it matters has no check at all.',
  },
  {
    goal: 'Club badges in hand the week before the fair.',
    steps: [
      'Agree the design with the committee',
      'Send the agreed design to the printer',
      'Check the proof the printer sends back',
      'Approve the proof so the run can start',
      'Collect the badges the week before the fair',
    ],
    note: 'The proof step looks like a formality and is the cheapest place in the whole chain to catch a spelling mistake. After approval the same mistake costs a reprint.',
  },
]

const backwardOrder = tpl(
  {
    id: 'dd-backward-order',
    name: 'Work back from the goal',
    skillIds: ['st-decomp'],
    bucket: STRAT,
    difficulty: 2,
    variants: ORDER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ORDER_CASES)
    let display = shuffle(rng, c.steps)
    // A display order that already IS the answer turns the item into "submit".
    if (display.every((s, i) => s === c.steps[i])) display = [...display.slice(1), display[0]]
    const correct = c.steps.map((s) => display.indexOf(s))
    return {
      title: 'Order the plan',
      prompt:
        `GOAL: **${c.goal}**\n\n` +
        `Start at the goal and ask what must be true just before it, then just before that. Put the steps into the order that actually works.`,
      answer: { type: 'order', options: display, correct },
      hints: [
        'Do not start at the beginning. Start at the goal and walk backwards, asking what each step needs before it can happen.',
        'Look for steps that eat another step\'s output — a measurement, a decision, a file. Those pairs are locked in place.',
        `Worked path: ${c.steps.join(' → ')}.`,
      ],
      explanation:
        `${c.steps.join(' → ')}.\n\n${c.note}\n\n` +
        `Working backwards is not a different way of writing the same list. Forwards, you write the steps you can picture yourself doing; backwards, each step is forced to justify itself by naming what it hands to the step after it. Anything that cannot name one is decoration, and anything missing shows up as a gap where an input should be.`,
    }
  },
)

interface StartCase {
  scene: string
  /** Things that already exist. A task is startable when its input is in here. */
  have: string[]
  tasks: { label: string; needs: string }[]
}

const START_CASES: StartCase[] = [
  {
    scene: 'The club newsletter goes out on Friday.',
    have: ['the interview notes from the caretaker', 'last term\'s page template', 'a list of who is on the rota'],
    tasks: [
      { label: 'Lay out the whole issue', needs: 'the finished lead story' },
      { label: 'Write up the caretaker piece', needs: 'the interview notes from the caretaker' },
      { label: 'Proofread the finished pages', needs: 'a complete laid-out draft' },
      { label: 'Print and staple the copies', needs: 'the signed-off final layout' },
    ],
  },
  {
    scene: 'The science-fair board is due on judging day.',
    have: ['the results of the first six trials', 'a blank board and mounting tape', 'the printed judging criteria'],
    tasks: [
      { label: 'Chart the first six trials', needs: 'the results of the first six trials' },
      { label: 'Write the conclusion panel', needs: 'the results of every trial' },
      { label: 'Print the finished panels', needs: 'all the panels written up' },
      { label: 'Mount the panels on board', needs: 'the printed panels' },
    ],
  },
  {
    scene: 'The team is travelling to an away fixture.',
    have: ['the confirmed kick-off time', 'the club\'s contact list', 'a quote from the coach company'],
    tasks: [
      { label: 'Send out the timings', needs: 'the confirmed kick-off time' },
      { label: 'Book the coach for the day', needs: 'the final head count' },
      { label: 'Print the team sheet', needs: 'the squad the coach picks' },
      { label: 'Pack the kit into bags', needs: 'the kit back from the wash' },
    ],
  },
  {
    scene: 'The end-of-term play opens on Thursday.',
    have: ['the finished script', 'the hall booked for two evenings', 'a box of last year\'s costumes'],
    tasks: [
      { label: 'Read the play through', needs: 'the finished script' },
      { label: 'Build the two set flats', needs: 'the timber that was ordered' },
      { label: 'Fit each cast member', needs: 'the cast list from auditions' },
      { label: 'Run the light plot', needs: 'the finished set on stage' },
    ],
  },
  {
    scene: 'The garden bed has to be planted this month.',
    have: ['a delivery of compost', 'the plan drawn on paper', 'the key to the shed'],
    tasks: [
      { label: 'Spread the compost out', needs: 'a delivery of compost' },
      { label: 'Plant the young plants', needs: 'the plants from the nursery' },
      { label: 'Lay the edging stones', needs: 'the stones that were ordered' },
      { label: 'Water in what is planted', needs: 'the plants in the ground' },
    ],
  },
  {
    scene: 'The charity walk happens on the last Sunday.',
    have: ['the route approved by the school', 'a roll of sponsor forms', 'the first-aid kit'],
    tasks: [
      { label: 'Print the sponsor forms', needs: 'a roll of sponsor forms' },
      { label: 'Count what was raised', needs: 'the signed forms back in' },
      { label: 'Brief all of the marshals', needs: 'the list of who is marshalling' },
      { label: 'Post the route to families', needs: 'the marshal points marked on it' },
    ],
  },
  {
    scene: 'The band is releasing one song this term.',
    have: ['the recorded drum and bass parts', 'a booked studio hour on Friday', 'the artwork sketch'],
    tasks: [
      { label: 'Mix the rhythm section', needs: 'the recorded drum and bass parts' },
      { label: 'Add the vocal take', needs: 'the vocals recorded on Friday' },
      { label: 'Master the finished mix', needs: 'the full mix signed off' },
      { label: 'Upload the finished song', needs: 'the mastered audio file' },
    ],
  },
  {
    scene: 'The stall needs to be ready for the summer fair.',
    have: ['the pitch confirmed by the organisers', 'two trestle tables', 'a float of coins'],
    tasks: [
      { label: 'Measure the pitch space', needs: 'the pitch confirmed by the organisers' },
      { label: 'Order the printed signs', needs: 'the wording the committee agrees' },
      { label: 'Price up all the stock', needs: 'the stock delivered to school' },
      { label: 'Draw the table layout', needs: 'the pitch measurements' },
    ],
  },
]

const blockedStep = tpl(
  {
    id: 'dd-blocked-step',
    name: 'Which one can start today?',
    skillIds: ['st-decomp'],
    bucket: STRAT,
    difficulty: 2,
    variants: START_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, START_CASES)
    // The key is READ OFF the data, never authored: a task can start exactly
    // when the thing it needs is already on the "we have" list.
    const ready = c.tasks.filter((t) => c.have.includes(t.needs))
    const key = ready[0] ?? c.tasks[0]
    const noted = mcqNoted(
      rng,
      key.label,
      c.tasks
        .filter((t) => t.label !== key.label)
        .map((t) => [t.label, `Waiting on ${t.needs}, which does not exist yet. Starting it today produces a guess that has to be redone.`, 'strategy' as const]),
    )
    return {
      title: 'Find the free task',
      prompt:
        `${c.scene}\n\nAlready done or already here: ${c.have.join('; ')}.\n\n` +
        c.tasks.map((t) => `- **${t.label}** — needs ${t.needs}`).join('\n') +
        `\n\nWhich one can you actually start today?`,
      ...noted,
      hints: [
        'Take each task and find the thing it needs. Then look for that thing on the list of what already exists.',
        'A task whose input is missing can be started — it just cannot be finished, and the work usually has to be redone once the input arrives.',
        `Worked path: **${key.label}** needs ${key.needs}, and that is already here.`,
      ],
      explanation:
        `**${key.label}** — it needs ${key.needs}, which is already on the list. Every other task here is waiting on something that does not exist yet.\n\n` +
        `This is the question that turns a plan into an afternoon. A list of five things to do is not a list of five things you can do, and the difference is invisible until you write down what each one needs as its input. The failure it prevents is the expensive one: starting a blocked task anyway, guessing the missing input, and rebuilding the work when the real one turns up.`,
    }
  },
)

const JUST_BEFORE: Choice[] = [
  {
    scene: 'GOAL: the essay is handed in on Monday morning.',
    correct: 'A finished draft is printed and in your bag',
    wrong: [
      'You have decided which of the questions to answer',
      'You have read the three sources you chose to use',
      'You have written a plan of the paragraphs you need',
    ],
    tempt: 'The paragraph plan tempts because it is the last step that feels like real work. It is two moves back — the hand-in consumes a printed draft, and nothing else.',
  },
  {
    scene: 'GOAL: the photograph is hanging in the exhibition.',
    correct: 'The mounted print is handed in at the desk',
    wrong: [
      'The photograph has been chosen out of the folder',
      'The print has been ordered at the size the rules set',
      'The entry rules have been read from start to finish',
    ],
    tempt: 'Ordering the print tempts because it is the step with money attached, and cost feels like importance. What the wall actually consumes is a mounted print at the desk.',
  },
  {
    scene: 'GOAL: the stall opens at nine on market morning.',
    correct: 'The stock is boxed and loaded the night before',
    wrong: [
      'The pitch has been booked and paid for in advance',
      'The prices have been agreed and written up neatly',
      'The cloth has been washed and ironed',
    ],
    tempt: 'The booked pitch tempts because without it there is no stall at all. Necessary is not the same as immediately before: the pitch was settled weeks back, and opening at nine consumes a loaded car.',
  },
  {
    scene: 'GOAL: the song is uploaded on release day.',
    correct: 'The final mix has been exported as one file',
    wrong: [
      'The parts have all been recorded in the studio',
      'The artwork has been drawn, coloured and scanned',
      'The release date has been announced',
    ],
    tempt: 'The announced date tempts because it is the most public step and it feels like the commitment. It commits nothing technical: the upload consumes one exported file.',
  },
  {
    scene: 'GOAL: the talk is delivered to the class on Thursday.',
    correct: 'You have run the whole thing out loud once',
    wrong: [
      'The slides have been written and put into order',
      'The topic has been checked and agreed with your teacher',
      'The room has been booked for Thursday, period four',
    ],
    tempt: 'The finished slides tempt because they are the visible artifact, and people treat the artifact as the goal. A talk consumes a rehearsal; slides are what the rehearsal is done with.',
  },
  {
    scene: 'GOAL: the bike is ridden to school on the first day.',
    correct: 'The new brake blocks are fitted and tested',
    wrong: [
      'The bike has been checked over for what is wrong',
      'The parts have been ordered from the shop in town',
      'The route to school has been worked out on a map',
    ],
    tempt: 'The ordered parts tempt because ordering feels like solving. Parts in a box are not parts on a bike, and the ride consumes a fitted, tested brake.',
  },
  {
    scene: 'GOAL: the badges are handed out at the fair.',
    correct: 'The printed badges are collected from the shop',
    wrong: [
      'The design has been agreed by the whole committee',
      'The proof from the printer has been checked and approved',
      'The stall has a place at the fair',
    ],
    tempt: 'Approving the proof tempts because it is the last decision anyone makes. A decision is not an object: what the fair consumes is a box of badges that somebody went and collected.',
  },
  {
    scene: 'GOAL: the cake is on the table when everyone arrives.',
    correct: 'The cake has cooled right through and been iced',
    wrong: [
      'The tin has been lined and the oven brought up to heat',
      'The recipe has been read and the eggs weighed out',
      'The candles have been bought from the shop on the corner',
    ],
    tempt: 'The candles tempt because they are the last thing you buy, and shopping feels late in a plan. Buying is not making: the table consumes an iced cake, and icing needs a cake that has cooled.',
  },
  {
    scene: 'GOAL: the video is shown in assembly on Friday.',
    correct: 'The edited file plays on the hall laptop',
    wrong: [
      'The clips have all been filmed and saved to the drive',
      'The music has been chosen for the pictures',
      'The assembly slot has been agreed with the head of year',
    ],
    tempt: 'The saved clips tempt because filming is where the effort went. Effort is not the test: an assembly consumes a file that has been proved to play on the machine in that room.',
  },
  {
    scene: 'GOAL: the team plays the away fixture on Saturday.',
    correct: 'Everyone is at the meeting point with their kit',
    wrong: [
      'The fixture has been agreed with the other club',
      'The coach has picked the squad for the weekend',
      'Permission slips have gone home and come back signed',
    ],
    tempt: 'The signed slips tempt because they are the step with the most chasing in it, and chasing feels like the bottleneck. What Saturday consumes is bodies and kit at a meeting point.',
  },
]

const justBefore = tpl(
  {
    id: 'dd-just-before',
    name: 'What has to be true just before?',
    skillIds: ['st-decomp'],
    bucket: STRAT,
    difficulty: 3,
    variants: JUST_BEFORE.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, JUST_BEFORE)
    return {
      title: 'One step back from the goal',
      prompt: `${c.scene}\n\nAll four of these have to happen. Which one has to be true **immediately** before the goal — the thing the goal itself consumes?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what the goal EATS. A goal always consumes something: an object, a file, a person in a place.',
        'Three of these are real steps that happen earlier. Being necessary does not make a step the last one.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The reason this question is worth asking rather than just listing the steps: the immediate predecessor is where the deadline actually lives. Everything before it can slip a little and be recovered; that one cannot slip at all, because there is nothing between it and the goal to absorb the delay.`,
    }
  },
)

interface RunwayCase {
  scene: string
  deadline: string
  steps: [string, string, string, string]
}

const RUNWAY_CASES: RunwayCase[] = [
  {
    scene: 'The club magazine',
    deadline: 'has to be in people\'s hands on the last day of term',
    steps: ['writing the articles', 'laying out the pages', 'the printer\'s turnaround', 'folding and bagging'],
  },
  {
    scene: 'The science-fair board',
    deadline: 'has to be on the table at nine on judging day',
    steps: ['running the last trials', 'making the charts', 'printing the panels', 'mounting the board'],
  },
  {
    scene: 'The team hoodies',
    deadline: 'have to be handed out at the last training session',
    steps: ['collecting everyone\'s size', 'agreeing the design', 'the supplier\'s printing time', 'sorting them into bags'],
  },
  {
    scene: 'The charity walk',
    deadline: 'has to happen on the last Sunday of term',
    steps: ['getting the route approved', 'printing the sponsor forms', 'collecting them back in', 'briefing the marshals'],
  },
  {
    scene: 'The end-of-term play',
    deadline: 'has to be performed on the Thursday evening',
    steps: ['casting the parts', 'learning the lines', 'building the set', 'the technical rehearsal'],
  },
]

const runway = tpl(
  {
    id: 'dd-runway',
    name: 'Does the chain fit before the date?',
    skillIds: ['st-decomp', 'st-estimate'],
    bucket: STRAT,
    difficulty: 3,
    variants: 10,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, RUNWAY_CASES)
    // Durations drawn until one step is strictly the longest, so "which step
    // would you shorten?" has exactly one answer.
    let days = [3, 4, 5, 6]
    for (let tries = 0; tries < 200; tries++) {
      const draw = [rint(rng, 2, 8), rint(rng, 2, 8), rint(rng, 2, 8), rint(rng, 2, 8)]
      const top = Math.max(...draw)
      if (draw.filter((d) => d === top).length === 1) {
        days = draw
        break
      }
    }
    const total = days.reduce((a, b) => a + b, 0)
    const slack = rint(rng, -3, 6)
    const available = total + slack
    const longest = days.indexOf(Math.max(...days))
    const fits = slack >= 0

    const spare = `${slack} spare ${slack === 1 ? 'day' : 'days'}`
    const short = `${-slack} ${slack === -1 ? 'day' : 'days'} short`
    const fitKey = `It fits with ${spare} — start now and keep the margin`
    const shortKey = `The plan is ${short} — cut a step or move the date`
    const verdictKey = fits ? fitKey : shortKey
    const verdictWrong = fits
      ? [
          `Wait ${spare.replace(' spare', '')}, then start — the spare time is there to be used`,
          'Add more to the plan until every spare day has been filled up',
          'Leave it alone; estimates like these have room in them',
        ]
      : [
          `Start now and make up the ${short.replace(' short', '')} by working faster than planned`,
          'Run two of the steps at once, whether or not that is possible',
          'Leave it alone; estimates like these have room in them',
        ]

    return {
      title: 'Count the runway',
      prompt:
        `${c.scene} ${c.deadline}. Nothing here can run at the same time as anything else — each step needs the one before it finished.\n\n` +
        c.steps.map((s, i) => `- **${s.charAt(0).toUpperCase() + s.slice(1)}** — ${days[i]} working days`).join('\n') +
        `\n\nThere are **${available} working days** left before the date.`,
      parts: [
        {
          stage: 'Chain',
          prompt: 'How many working days does the whole chain need? Add the four steps.',
          answer: numeric(total),
          explanation:
            `${days.join(' + ')} = **${total} days**. Because nothing overlaps, the chain costs the SUM. That is worth saying out loud, because the same four steps running two at a time would cost far less — and people price serial plans as though they were parallel all the time.`,
          hints: [
            'Nothing overlaps here, so the four durations simply add.',
            `Add the four straight through: ${days[0]} + ${days[1]} + ${days[2]} + ${days[3]}.`,
            `${days.join(' + ')} = **${total}**.`,
          ],
        },
        {
          stage: 'Slack',
          prompt: 'How many days of slack does that leave? Take the chain off the days available. A negative number is a real answer.',
          answer: numeric(slack),
          explanation:
            `${available} − ${total} = **${slack}**. ${fits ? `Positive slack is the room the plan has for one thing going wrong. ${spare} is not much, and it is the whole margin.` : `Negative slack means the plan does not fit — it is ${short.replace(' short', '')} longer than the time that exists, and no amount of starting promptly changes that.`}`,
          hints: [
            'Slack is the days you have minus the days the work needs.',
            `Subtract the work from the time you have: ${available} − ${total}.`,
            `${available} − ${total} = **${slack}**.`,
          ],
        },
        {
          stage: 'Call it',
          prompt: 'What does that number actually tell you to do?',
          answer: mcq(rng, verdictKey, verdictWrong),
          explanation:
            `**${verdictKey}**. ${fits ? 'Spare days are not free time at the front of a plan; they are the buffer that absorbs the one step that runs long. Spending them by starting later converts a plan that fits into a plan with no margin at all.' : 'A plan that is short of days does not become a plan that fits because everyone agrees to try hard. The two honest moves are the same two every time: take work out, or move the date — and both are far cheaper said now than discovered in the last week.'}`,
          hints: [
            'A positive slack number is a buffer. A negative one is a shortfall, and shortfalls do not respond to effort.',
            'Two of the wrong answers assume the estimates are soft. Treat them as the best numbers you have until you have better ones.',
            `Worked path: slack is ${slack}, so **${fits ? 'it fits, with a small margin' : 'it does not fit'}**.`,
          ],
        },
      ],
      hints: [
        'Add the four durations first — nothing overlaps, so nothing is saved.',
        'Then subtract that total from the days available. The sign of the answer is the whole message.',
        `Worked path: ${total} days of work against ${available} available, so slack is **${slack}**.`,
      ],
      explanation:
        `The chain needs ${days.join(' + ')} = **${total} days**, and there are ${available}, so the slack is **${slack}**.\n\n` +
        `The longest single step is ${c.steps[longest]} at ${days[longest]} days, which is where shortening buys the most — on a chain with no overlap, a day saved anywhere is a day saved overall, but the long step is usually the one with slack inside it.\n\n` +
        `The reason to do this arithmetic at the start rather than in the last week is that both repairs are cheap early and impossible late. Cutting scope on a Monday is a decision; cutting it on the last night is a disaster with a name attached.`,
    }
  },
)

// ===========================================================================
// st-estimate — predict, then score the prediction
// ===========================================================================

interface LedgerCase {
  scene: string
  jobs: [string, string, string]
  next: string
  unit: string
}

const LEDGER_CASES: LedgerCase[] = [
  {
    scene: 'You have started writing down how long homework actually takes.',
    jobs: ['the history essay', 'the maths problem set', 'the lab write-up'],
    next: 'the book review',
    unit: 'minutes',
  },
  {
    scene: 'The stage crew keeps a note of how long each build really takes.',
    jobs: ['painting the first flat', 'sewing the two capes', 'wiring the lamps'],
    next: 'building the door frame',
    unit: 'minutes',
  },
  {
    scene: 'You have been timing the panels of the corridor mural.',
    jobs: ['the first coat', 'the outline of panel two', 'the lettering'],
    next: 'the border',
    unit: 'minutes',
  },
  {
    scene: 'The book-sale team logged how long each job took last year.',
    jobs: ['sorting the donations', 'pricing the stock', 'setting out the tables'],
    next: 'packing everything away',
    unit: 'minutes',
  },
  {
    scene: 'You are keeping a record of how long each video edit takes.',
    jobs: ['the first edit', 'the second edit', 'the third edit'],
    next: 'the fourth edit',
    unit: 'minutes',
  },
  {
    scene: 'You have started timing revision sessions instead of guessing.',
    jobs: ['the geography poster', 'the vocabulary list', 'the revision cards'],
    next: 'the history timeline',
    unit: 'minutes',
  },
]

/** Multiplier triples in TENTHS whose sum divides by three — no float dust. */
const RATIO_TRIPLES: number[][] = [
  [12, 14, 16],
  [11, 15, 19],
  [13, 15, 17],
  [12, 15, 18],
  [10, 14, 18],
  [11, 12, 16],
  [13, 14, 15],
  [12, 13, 17],
]

const estLedger = tpl(
  {
    id: 'dd-est-ledger',
    name: 'Your own correction factor',
    skillIds: ['st-estimate'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, LEDGER_CASES)
    let tenths = shuffle(rng, cycle(seed, RATIO_TRIPLES))
    // The first job's multiple must not equal the average of the three, or two
    // of the four answer boxes take the same number.
    if (tenths[0] * 3 === tenths[0] + tenths[1] + tenths[2]) tenths = [tenths[1], tenths[0], tenths[2]]
    const predicted = tenths.map(() => rint(rng, 3, 9) * 10)
    const actual = predicted.map((p, i) => (p * tenths[i]) / 10)
    const meanTenths = (tenths[0] + tenths[1] + tenths[2]) / 3
    const mean = round(meanTenths / 10, 2)
    const first = round(tenths[0] / 10, 2)
    const overrun = actual[0] - predicted[0]
    const tonight = rint(rng, 3, 9) * 10
    const planFor = (tonight * meanTenths) / 10

    return {
      title: 'Score three predictions',
      prompt:
        `${c.scene}\n\n` +
        c.jobs
          .map((j, i) => `- **${j.charAt(0).toUpperCase() + j.slice(1)}** — you said ${predicted[i]} ${c.unit}, it took ${actual[i]}`)
          .join('\n') +
        `\n\nTonight you look at **${c.next}** and think **${tonight} ${c.unit}**.`,
      parts: [
        {
          stage: 'Overrun',
          prompt: `By how many ${c.unit} did the first job run over your estimate?`,
          answer: numeric(overrun),
          explanation:
            `${actual[0]} − ${predicted[0]} = **${overrun} ${c.unit}**. A single overrun is a story you can explain away — the point of writing three of them down is that the excuses stop matching after the second one.`,
          hints: [
            'Actual time minus the time you predicted.',
            `Take the overrun as a difference: ${actual[0]} − ${predicted[0]}.`,
            `${actual[0]} − ${predicted[0]} = **${overrun}**.`,
          ],
        },
        {
          stage: 'Multiple',
          prompt: 'Now as a multiple: the first job took how many times your estimate? Give one decimal place.',
          answer: numeric(first, { tolerance: 0.005 }),
          explanation:
            `${actual[0]} ÷ ${predicted[0]} = **${first}**. The multiple is the useful form because it travels between jobs of different sizes, which a raw overrun in ${c.unit} does not: being 40 out on a 60-minute job and on a 600-minute job are not the same mistake.`,
          hints: [
            'Divide what it took by what you said it would take.',
            `Express it as a multiple of the estimate: ${actual[0]} ÷ ${predicted[0]}.`,
            `${actual[0]} ÷ ${predicted[0]} = **${first}**.`,
          ],
        },
        {
          stage: 'Average',
          prompt: 'Work out the multiple for all three, then average them. One decimal place.',
          answer: numeric(mean, { tolerance: 0.005 }),
          explanation:
            `The three multiples are ${tenths.map((t) => round(t / 10, 2)).join(', ')}, and their average is **${mean}**. That single number is your correction factor, and it belongs to you — it is built from your record, not from a rule somebody published.`,
          hints: [
            'Do the same division for each job, then add the three results and divide by three.',
            `Multiples: ${tenths.map((t) => round(t / 10, 2)).join(', ')}.`,
            `(${tenths.map((t) => round(t / 10, 2)).join(' + ')}) ÷ 3 = **${mean}**.`,
          ],
        },
        {
          stage: 'Tonight',
          prompt: `Apply it. What should you actually plan for tonight, in ${c.unit}?`,
          answer: numeric(planFor),
          explanation:
            `${tonight} × ${mean} = **${planFor} ${c.unit}**. Notice what the correction did not need: any theory about why you run over, any promise to concentrate harder, or any judgement about whether tonight feels different. It is arithmetic on your own record, and it works whether or not you can explain it.`,
          hints: [
            'Multiply tonight\'s estimate by the correction factor you just worked out.',
            `Scale the estimate by that factor: ${tonight} × ${mean}.`,
            `${tonight} × ${mean} = **${planFor}**.`,
          ],
        },
      ],
      hints: [
        'Turn each job into a multiple — what it took divided by what you said.',
        'Average the three multiples, then multiply tonight\'s estimate by that average.',
        `Worked path: multiples ${tenths.map((t) => round(t / 10, 2)).join(', ')}, average ${mean}, so ${tonight} × ${mean} = **${planFor}**.`,
      ],
      explanation:
        `The three jobs came in at ${tenths.map((t) => round(t / 10, 2)).join(', ')} times their estimates, averaging **${mean}**. Tonight's ${tonight} ${c.unit} should therefore be planned as **${planFor}**.\n\n` +
        `Two honest limits. Three jobs is a small record, so the factor will move as you add more — and the fix for that is more entries, not a more complicated sum. And a correction factor predicts nothing about a job unlike the ones in the log: it is a fact about how you estimate THIS kind of work, and using it on something genuinely new is borrowing a number from the wrong place.`,
    }
  },
)

interface ForecastCase {
  scene: string
  a: string
  b: string
  jobs: [string, string, string]
}

const FORECAST_CASES: ForecastCase[] = [
  {
    scene: 'Two people on the crew guessed how long each job would take, before it started.',
    a: 'Ana',
    b: 'Ben',
    jobs: ['painting the backdrop', 'building the two flats', 'rigging the lights'],
  },
  {
    scene: 'Two committee members predicted how long each fair job would take.',
    a: 'Ruth',
    b: 'Milo',
    jobs: ['setting up the stalls', 'running the raffle table', 'clearing the field'],
  },
  {
    scene: 'Two of you guessed the timings for the club\'s open day before it ran.',
    a: 'Iris',
    b: 'Otto',
    jobs: ['the sign-up desk', 'the taster session', 'the tidy-up afterwards'],
  },
  {
    scene: 'Two members predicted how long each stage of the build would take.',
    a: 'Nell',
    b: 'Gus',
    jobs: ['cutting the timber', 'assembling the frame', 'sanding and painting'],
  },
  {
    scene: 'Two of you wrote down predictions for the video project.',
    a: 'Pia',
    b: 'Zac',
    jobs: ['filming the interviews', 'cutting the first pass', 'adding the captions'],
  },
  {
    scene: 'Two people guessed how long each part of the garden day would take.',
    a: 'Edie',
    b: 'Rex',
    jobs: ['clearing the old bed', 'digging in the compost', 'planting it up'],
  },
]

const estScored = tpl(
  {
    id: 'dd-est-scored',
    name: 'Which forecaster was actually closer?',
    skillIds: ['st-estimate'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, FORECAST_CASES)
    const actual = [rint(rng, 14, 26) * 5, rint(rng, 14, 26) * 5, rint(rng, 14, 26) * 5]
    const k = rint(rng, 2, 4) * 5
    // A is off by the same amount every time; B is exactly right once and far
    // out twice, so "exact once" and "closer overall" point at different people.
    const aPred = actual.map((v, i) => (i % 2 === 0 ? v + k : v - k))
    const exact = rint(rng, 0, 2)
    const bGaps = [0, 0, 0].map(() => rint(rng, 2 * k, 3 * k))
    const bPred = actual.map((v, i) => (i === exact ? v : i % 2 === 0 ? v - bGaps[i] : v + bGaps[i]))
    const errA = aPred.reduce((s, p, i) => s + Math.abs(p - actual[i]), 0)
    const errB = bPred.reduce((s, p, i) => s + Math.abs(p - actual[i]), 0)

    const key = `${c.a} is closer overall, though ${c.b} was exactly right once`
    return {
      title: 'Add up the misses',
      prompt:
        `${c.scene} Here is what happened, in minutes.\n\n` +
        c.jobs
          .map((j, i) => `- **${j.charAt(0).toUpperCase() + j.slice(1)}** — ${c.a} said ${aPred[i]}, ${c.b} said ${bPred[i]}, it took ${actual[i]}`)
          .join('\n') +
        `\n\nScore each of them by adding up how far out they were, ignoring whether they were over or under.`,
      parts: [
        {
          stage: c.a,
          prompt: `How far out was ${c.a} in total, adding the three gaps?`,
          answer: numeric(errA),
          explanation:
            `${aPred.map((p, i) => Math.abs(p - actual[i])).join(' + ')} = **${errA} minutes**. Dropping the plus and minus signs matters: a forecaster who is 20 over and 20 under has not been accurate twice, and letting the errors cancel would score them as perfect.`,
          hints: [
            'Take each gap as a positive number, however it fell.',
            `Gaps: ${aPred.map((p, i) => Math.abs(p - actual[i])).join(', ')}.`,
            `${aPred.map((p, i) => Math.abs(p - actual[i])).join(' + ')} = **${errA}**.`,
          ],
        },
        {
          stage: c.b,
          prompt: `Now the same for ${c.b}.`,
          answer: numeric(errB),
          explanation:
            `${bPred.map((p, i) => Math.abs(p - actual[i])).join(' + ')} = **${errB} minutes**. One of those gaps is zero — an exact hit on ${c.jobs[exact]} — and the total is still the larger of the two.`,
          hints: [
            'Same method. One of the three gaps is zero.',
            `Gaps: ${bPred.map((p, i) => Math.abs(p - actual[i])).join(', ')}.`,
            `${bPred.map((p, i) => Math.abs(p - actual[i])).join(' + ')} = **${errB}**.`,
          ],
        },
        {
          stage: 'Verdict',
          prompt: 'Whose numbers would you plan next term with?',
          answer: mcq(rng, key, [
            // Two phrasings of the same misconception, rotated by seed so the
            // key is sometimes the middle length and sometimes the shortest.
            seed % 2 === 0
              ? `${c.b} is better — the one exact hit proves it`
              : `${c.b} is better, since being exactly right is what really counts`,
            `Neither is any use, since both of them missed badly on two of the three jobs`,
            `They are equally good, because being close and being exactly right both count`,
          ]),
          explanation:
            `**${key}** — ${errA} against ${errB} minutes of total error. An exact hit is memorable and almost worthless on its own: it is one result out of three, and ${c.b}'s other two are the widest misses on the board.\n\n` +
            `This is why forecasters are scored on TOTAL error rather than on hits. A hit-counting scoreboard rewards whoever happens to land on the number, which is mostly luck at this sample size, and it says nothing at all about how wrong the misses were.`,
          hints: [
            'Compare the two totals you just worked out. Nothing else has been measured.',
            'An exact hit is one result. Ask what the other two results were doing while it happened.',
            `Worked path: ${errA} against ${errB}, so **${c.a}**.`,
          ],
        },
      ],
      hints: [
        'Turn every prediction into a gap: how far from the real number, as a positive amount.',
        'Add each person\'s three gaps, then compare the two totals.',
        `Worked path: ${c.a} totals ${errA}, ${c.b} totals ${errB}.`,
      ],
      explanation:
        `${c.a} is out by **${errA} minutes** in total and ${c.b} by **${errB}**, so ${c.a}'s numbers are the ones to plan with — even though ${c.b} was exactly right on ${c.jobs[exact]} and ${c.a} was never exactly right at all.\n\n` +
        `The useful habit is writing predictions down before the work starts. Without that, nobody can be scored, and the argument about who estimates well is settled by whoever remembers their best guess most vividly.`,
    }
  },
)

const RANGE_CASES: { scene: string; thing: string }[] = [
  { scene: 'You have been giving each piece of homework a "done by" time before you start.', thing: 'homework sessions' },
  { scene: 'The crew has been predicting a finish time for every build job.', thing: 'build jobs' },
  { scene: 'You have been guessing how long each bike ride will take before setting off.', thing: 'rides' },
  { scene: 'The committee predicts a finish time for each stall shift before the fair.', thing: 'shifts' },
  { scene: 'You have been putting a "ready by" time on each meal you cook.', thing: 'meals' },
  { scene: 'The group predicts how long each meeting will run before it starts.', thing: 'meetings' },
  { scene: 'You have been predicting how long each revision block will take.', thing: 'revision blocks' },
  { scene: 'The team predicts a finish time for every kit wash and repair round.', thing: 'kit rounds' },
]

/**
 * Four verdicts of near-identical length, deliberately. Each is the key for
 * some hit rates and a distractor for others, so any length difference between
 * them would be a free answer roughly a quarter of the time.
 */
const RANGE_VERDICTS = [
  'Far too tight — the real times keep landing outside',
  'A little tight — widen them and check again shortly',
  'About right — carry on making them the same way now',
  'Too generous — nothing you do ever lands outside it',
]

const estRange = tpl(
  {
    id: 'dd-est-range',
    name: 'Was your 8-in-10 really 8 in 10?',
    skillIds: ['st-estimate'],
    bucket: STRAT,
    difficulty: 3,
    variants: RANGE_CASES.length,
    minutes: 3,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, RANGE_CASES)
    // Seed-driven so all four verdicts are reachable, including "about right".
    const hits = 3 + (seed % 8)
    const pct = hits * 10
    const key = hits <= 5 ? RANGE_VERDICTS[0] : hits <= 7 ? RANGE_VERDICTS[1] : hits <= 9 ? RANGE_VERDICTS[2] : RANGE_VERDICTS[3]

    return {
      title: 'Check the claim against the count',
      prompt:
        `${c.scene} Each time you picked a time you were **80% sure** you would finish by — meaning you expected to beat it about **8 times in 10**.\n\n` +
        `Over the last ten ${c.thing}, you finished by your stated time **${hits} times**.`,
      parts: [
        {
          stage: 'Rate',
          prompt: 'What share of the ten did you land inside, as a percentage?',
          answer: numeric(pct, { unit: '%' }),
          explanation:
            `${hits} out of 10 is **${pct}%**. Turning the count into a percentage is what lets you hold it next to the 80% you claimed — two numbers in the same units, which is the whole trick.`,
          hints: [
            'Out of ten, so each one is worth ten percent.',
            `Turn the count out of ten into a percentage: ${hits} × 10.`,
            `${hits} out of 10 = **${pct}%**.`,
          ],
        },
        {
          stage: 'Read it',
          prompt: 'You claimed 80%. What does the count say about your times?',
          answer: mcq(rng, key, RANGE_VERDICTS.filter((v) => v !== key)),
          explanation:
            `**${key}** — you claimed 80% and landed ${pct}%.\n\n` +
            `${hits <= 7 ? 'A time you beat less often than you claimed is not a prediction, it is a hope with a number attached. The repair is unglamorous and it works: push the stated time out until you are beating it about eight times in ten, and let the honest number be the one you tell people.' : hits === 10 ? 'Landing inside every single time sounds like success and is the other failure. A time you never miss carries no information — it is so far out that agreeing to it costs you nothing and tells the person waiting on you nothing either.' : 'Claiming 80% and landing near 80% is what a well-calibrated estimate looks like. It does not mean the times are short; it means the number you say out loud matches what happens, which is the only thing anyone else can plan around.'}`,
          hints: [
            'Put the two percentages side by side: the one you claimed, and the one you got.',
            'Landing inside every time is not the best possible score. Ask what such a range would have cost you to promise.',
            `Worked path: claimed 80%, landed ${pct}% — **${key}**.`,
          ],
        },
      ],
      hints: [
        'Turn the count out of ten into a percentage first.',
        'Then compare it with the 80% you claimed — too low and too high are both worth noticing.',
        `Worked path: ${hits} of 10 is ${pct}%, against a claim of 80%.`,
      ],
      explanation:
        `${hits} out of 10 is **${pct}%** against a claimed 80%: **${key}**.\n\n` +
        `What makes this worth doing rather than just trying harder: a confidence claim is checkable, and almost nobody checks it. Ten predictions and ten outcomes are enough to tell you whether "I am fairly sure" means 80% or 50% when you say it — and once you know which, you can say the honest one.\n\n` +
        `Two cautions. Ten is a small sample, so a 70% here is a nudge and not a verdict; keep counting. And this measures your times, not your speed. Widening a range makes you honest, not slower.`,
    }
  },
)

const OUTSIDE_CASES: { scene: string; job: string; unit: string }[] = [
  { scene: 'You have timed the last five science write-ups.', job: 'tonight\'s write-up', unit: 'minutes' },
  { scene: 'The crew has timed the last five set builds.', job: 'the next build', unit: 'minutes' },
  { scene: 'You have timed the last five practice essays.', job: 'the essay due Friday', unit: 'minutes' },
  { scene: 'The club has timed the last five sign-up desks it ran.', job: 'the open-day desk', unit: 'minutes' },
  { scene: 'You have timed the last five walks to the far pitch.', job: 'Saturday\'s walk', unit: 'minutes' },
  { scene: 'The group has timed the last five poster sessions.', job: 'the next poster', unit: 'minutes' },
  { scene: 'You have timed the last five times you cooked for the family.', job: 'Sunday\'s meal', unit: 'minutes' },
  { scene: 'The team has timed the last five kit repair rounds.', job: 'this week\'s round', unit: 'minutes' },
]

const estOutside = tpl(
  {
    id: 'dd-est-outside',
    name: 'The middle of your record, not the mood',
    skillIds: ['st-estimate'],
    bucket: STRAT,
    difficulty: 3,
    variants: OUTSIDE_CASES.length,
    minutes: 3.5,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, OUTSIDE_CASES)
    const b = rint(rng, 8, 14) * 5
    // Four ordinary sessions and one that went badly wrong. Median is b; the
    // mean is dragged to b + 9 by the single outlier.
    const values = shuffle(rng, [b - 10, b - 5, b, b + 5, b + 55])
    const median = b
    const mean = b + 9
    const gut = b - rint(rng, 2, 4) * 5

    return {
      title: 'Five actuals and a hunch',
      prompt:
        `${c.scene} In ${c.unit}: **${values.join(', ')}**.\n\n` +
        `Looking at ${c.job}, your gut says **${gut} ${c.unit}**.`,
      parts: [
        {
          stage: 'Middle',
          prompt: `Put the five in order. What is the middle value, in ${c.unit}?`,
          answer: numeric(median),
          explanation:
            `In order: ${[...values].sort((x, y) => x - y).join(', ')}. The middle one is **${median}**. Two sessions came in under it and two over, which is exactly what "middle" is claiming and all it is claiming.`,
          hints: [
            'Write the five out smallest to largest first.',
            `Sorted: ${[...values].sort((x, y) => x - y).join(', ')}.`,
            `The third of five is **${median}**.`,
          ],
        },
        {
          stage: 'Average',
          prompt: `Now the average of the five, in ${c.unit}.`,
          answer: numeric(mean),
          explanation:
            `${[...values].sort((x, y) => x - y).join(' + ')} = ${mean * 5}, and ${mean * 5} ÷ 5 = **${mean}**. The average sits ${mean - median} ${c.unit} above the middle value, and only one session is anywhere near it.`,
          hints: [
            'Add all five, then divide by five.',
            `Total: ${mean * 5}.`,
            `${mean * 5} ÷ 5 = **${mean}**.`,
          ],
        },
        {
          stage: 'Which one',
          prompt: 'Both are honest summaries of the same five numbers. Why prefer the middle value here?',
          answer: mcq(rng, 'One unusual session drags the average; the middle value ignores it', [
            'The average is harder to work out in your head',
            'The middle value is always the smaller of the two numbers you get',
            'An average only means something once you have ten or more readings to use',
          ]),
          explanation:
            `The ${b + 55} was one bad session, and it pulls the average up by ${mean - median} ${c.unit} on its own while moving the middle value not at all. When you want "what does this usually take", the middle value is the more honest summary of an ordinary run.\n\n` +
            `The claim that the middle is always smaller is the tempting error, and it is simply false: with one unusually FAST session the average would be dragged the other way and the middle value would sit above it. What the middle value is doing is ignoring how extreme the extremes are, in whichever direction they lie.`,
          hints: [
            'Look at what happens to each summary if you change the biggest number to something twice as big.',
            'One of the two summaries moves; the other does not move at all.',
            'Worked path: the single unusual session pulls the average and leaves the middle value alone.',
          ],
        },
      ],
      hints: [
        'Sort the five numbers before doing anything else.',
        'The middle of five is the third one; the average is the total divided by five.',
        `Worked path: middle **${median}**, average **${mean}**, gut ${gut}.`,
      ],
      explanation:
        `Sorted, the five are ${[...values].sort((x, y) => x - y).join(', ')}: middle **${median} ${c.unit}**, average **${mean}**. The gut number was ${gut}, which is ${median - gut} below the middle of your own record.\n\n` +
        `Reaching for the record before the feeling is the single most useful move in estimating, and it is unpopular for an obvious reason: the record is about the past and the feeling is about tonight, which genuinely does feel different. It always does. The record already contains five nights that felt different.`,
    }
  },
)

// ===========================================================================
// st-premortem — assume it failed, then repair what can be repaired
// ===========================================================================

const MODE_CASES: { plan: string; checkable: string[]; vague: string[] }[] = [
  {
    plan: 'The group will finish the model and the report in the fortnight before the deadline.',
    checkable: [
      'Nobody has checked whether the glue is still in the cupboard',
      'The two people writing the report have mocks in week one',
      'The model has to dry overnight and no day was left for it',
    ],
    vague: [
      'We do not take it seriously enough as a group',
      'We run out of time because it is a big project',
      'Something unexpected comes along and throws us off',
    ],
  },
  {
    plan: 'Sell 200 tickets for the club show before the end of term.',
    checkable: [
      'Only two people have actually agreed to sell any tickets',
      'The tickets are not printed and nobody has ordered them',
      'Half the year is away on the trip in the selling week',
    ],
    vague: [
      'People turn out to be less keen than we hoped',
      'We leave it too late and end up rushing the selling',
      'The target was more ambitious than anyone realised',
    ],
  },
  {
    plan: 'Run the club open day on the first Saturday of next term.',
    checkable: [
      'The hall booking has not been confirmed by the office',
      'Nobody has been asked to unlock the building at eight',
      'The taster session needs twelve mats and the store has six',
    ],
    vague: [
      'Not enough people turn up on the day itself',
      'The day does not go as smoothly as we would like',
      'We are not organised enough to pull something like this off',
    ],
  },
  {
    plan: 'Learn the piece well enough to play it at the concert in five weeks.',
    checkable: [
      'The hardest page has never once been played up to speed',
      'Two of the five weeks are taken up by the exam block',
      'The hall piano has a much heavier touch than mine',
    ],
    vague: [
      'I lose interest somewhere in the middle of it',
      'It turns out to be harder than I thought it would be',
      'I am not really a performer and it shows on the night',
    ],
  },
  {
    plan: 'Save enough for the trip by putting money aside every week.',
    checkable: [
      'The deposit falls due three weeks before I finish saving',
      'My shifts drop to one a week through December',
      'The money sits in the account I spend from',
    ],
    vague: [
      'I am not disciplined enough with money',
      'Something comes up and I dip into it',
      'It turns out to cost more than I expected',
    ],
  },
  {
    plan: 'Get the garden bed dug over and planted on the volunteer day.',
    checkable: [
      'Fourteen people are coming and there are two spades',
      'The compost is booked to arrive the day afterwards',
      'Nobody has checked whether the outside tap still works',
    ],
    vague: [
      'It just does not come together the way we pictured it',
      'People are less keen once they see the size of the job',
      'We are too ambitious about what one day can hold',
    ],
  },
  {
    plan: 'Publish the club newsletter every fortnight this term.',
    checkable: [
      'Only one person can use the layout software',
      'The print budget covers four issues and we planned six',
      'Two of the fortnights land inside the exam period',
    ],
    vague: [
      'We lose interest after the first couple of issues',
      'It is more work than anyone realises going in',
      'It quietly fizzles out, the way these things do',
    ],
  },
  {
    plan: 'Cycle to school every day next term.',
    checkable: [
      'The back light has been broken since October',
      'There is nowhere to lock a bike at the far gate',
      'Three mornings a week I have to walk my brother in',
    ],
    vague: [
      'I am not a morning person, so it will not last',
      'The novelty wears off after the first fortnight',
      'It is a nice idea, but life gets in the way',
    ],
  },
]

const preModes = tpl(
  {
    id: 'dd-pre-modes',
    name: 'Which failures can you actually act on?',
    skillIds: ['st-premortem'],
    bucket: STRAT,
    difficulty: 3,
    variants: MODE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, MODE_CASES)
    return {
      title: 'Sort the post-mortem you wrote in advance',
      prompt:
        `PLAN: ${c.plan}\n\n` +
        `It is the day after the deadline and the plan failed. Six reasons have been written down.\n\n` +
        `Select every one that names something you could go and **check, or change, this week**.`,
      answer: multi(rng, c.checkable, c.vague),
      hints: [
        'Read each line and ask what you would DO tomorrow morning if you believed it.',
        'Three of them name a thing with a location: a cupboard, a date, a number of mats. The other three name a mood.',
        `Worked path: ${c.checkable.join('; ')}.`,
      ],
      explanation:
        `The three you can act on: ${c.checkable.join('; ')}.\n\n` +
        `The other three are not false. "We leave it too late" is very often exactly what happens — it is just not a handle. A failure mode you can use has a checkable fact underneath it, and turning a mood into a fact is most of the work: "we are disorganised" becomes "nobody has been asked to unlock the building", which somebody can go and sort out in four minutes.\n\n` +
        `Worth knowing what this exercise is and is not. Writing as though the failure has already happened does reliably produce more failure modes than asking what might go wrong — that part is the point of it. What no study shows is that the exercise makes the eventual decision better. The list is the output; the repairs are yours, and they are the part that changes anything.`,
    }
  },
)

const FIX_CASES: (Choice & { failure: string })[] = [
  {
    scene: 'PLAN: publish the club newsletter every fortnight this term.',
    failure: 'The only person who can use the layout software is away for print week.',
    correct: 'Teach a second person the layout tool this fortnight',
    wrong: [
      'Ask everybody to be more flexible about who does what',
      'Buy a second copy of the layout software for the club',
      'Write the articles earlier so there is more time to lay out',
    ],
    tempt: 'Buying a second copy tempts because it looks like spending money on the problem. The scarce thing is the skill, not the licence, and one more licence nobody can use changes nothing.',
  },
  {
    scene: 'PLAN: take the team to the away fixture by coach.',
    failure: 'The coach company needs the head count three days ahead, and nobody replies until the night before.',
    correct: 'Ask for a small deposit by the Wednesday before',
    wrong: [
      'Ask everyone in the chat to reply promptly this time',
      'Book the biggest coach available so that everyone fits',
      'Send the reminder message a little earlier in the week',
    ],
    tempt: 'Booking the biggest coach tempts because it removes the consequence. It also costs the club money for empty seats and still leaves nobody knowing who is coming, which is the thing that was actually missing.',
  },
  {
    scene: 'PLAN: revise one unit each evening for the five nights before the exam.',
    failure: 'One evening always disappears to something nobody planned for.',
    correct: 'Plan six evenings for five evenings of work',
    wrong: [
      'Trust that a lost evening can be made up somehow later',
      'Promise yourself that this time nothing will get in the way',
      'Work longer on the evenings that do happen',
    ],
    tempt: 'Working longer on the surviving evenings tempts because it keeps the total hours the same. Tired hours at the end of a long day are not the same hours, and the plan has now quietly become a harder plan than the one you agreed to.',
  },
  {
    scene: 'PLAN: dig over and plant the garden bed on the volunteer day.',
    failure: 'Fourteen people are coming and the shed holds two spades.',
    correct: 'Borrow a set of twelve tools before the day',
    wrong: [
      'Hope that enough people bring something from home',
      'Split the group so that half of them come after lunch',
      'Send a message about how much work there is to get through',
    ],
    tempt: 'Splitting the group tempts because it matches people to tools. It also doubles the day for whoever is running it and leaves the same fourteen people short of the same twelve tools, one half at a time.',
  },
  {
    scene: 'PLAN: have the cake on the table, iced, at four o\'clock.',
    failure: 'Icing cannot go on until the cake is cold, and it comes out of the oven at three.',
    correct: 'Bake it the evening before so it is cold by morning',
    wrong: [
      'Ice it quickly at three and hope that it holds',
      'Buy an icing that is meant to set faster than the usual sort',
      'Start on everything else earlier so there is more time at three',
    ],
    tempt: 'Starting everything else earlier tempts because it is true that the afternoon is crowded. The clash is not between the cake and the other jobs; it is between the cake and physics, and moving the other jobs does not cool anything down.',
  },
  {
    scene: 'PLAN: show the finished video in assembly on Friday.',
    failure: 'The file has never been played on the hall laptop.',
    correct: 'Test it on that laptop earlier in the week',
    wrong: [
      'Export it in three formats and bring all of them',
      'Ask the technician to come along on Friday morning',
      'Bring your own laptop as well, in case something goes wrong',
    ],
    tempt: 'Bringing three formats and a spare laptop tempts because it feels thorough, and it is a fair backup. It is also a backup for a question you could simply answer on Tuesday for the price of five minutes and a walk to the hall.',
  },
  {
    scene: 'PLAN: run the sponsored walk on the last Sunday of term.',
    failure: 'The money comes back as cash and nobody has said who holds it.',
    correct: 'Agree who holds the cash box and where it is counted',
    wrong: [
      'Ask people to bring the right money on the day',
      'Print more sponsor forms so that more can be raised',
      'Remind all of the marshals to keep an eye on the money',
    ],
    tempt: 'Reminding the marshals tempts because it sounds like taking the risk seriously. Shared responsibility for cash is the same as nobody\'s responsibility, and the fix is a name, not an instruction.',
  },
  {
    scene: 'PLAN: hold the club open day on the first Saturday of term.',
    failure: 'The building is locked at eight and nobody has a key.',
    correct: 'Ask the office this week who opens on a Saturday',
    wrong: [
      'Tell everyone to come at half past eight instead',
      'Plan the first hour outdoors so the doors matter less',
      'Ask people to be patient if there is a wait outside at first',
    ],
    tempt: 'Planning the first hour outdoors tempts because it works around the problem without asking anybody for anything. It also moves the open day outside in whatever weather turns up, to avoid a question the office can answer in one email.',
  },
  {
    scene: 'PLAN: build the model and write the report in the fortnight before the deadline.',
    failure: 'The person writing the report has mock exams in week one, and the mocks cannot move.',
    correct: 'Put the report in week two and start the model now',
    wrong: [
      'Ask the teacher whether the mocks can be sat later',
      'Ask them to write the report during the mock week anyway',
      'Split the report between all four of you on the final day',
    ],
    tempt: 'Asking for the mocks to move tempts because it attacks the constraint head-on. Some constraints do not move, and a repair that depends on one moving is a wish; the useful move is to rearrange the plan around it while there is still room to.',
  },
  {
    scene: 'PLAN: cycle to school every day next term.',
    failure: 'The back light has been broken since October and the mornings are dark.',
    correct: 'Buy and fit a new back light before term starts',
    wrong: [
      'Set off ten minutes later so that it is lighter out',
      'Wear something bright and rely on drivers noticing you',
      'Get the light looked at some time in the next few weeks',
    ],
    tempt: '"Some time in the next few weeks" tempts because it agrees with you. A repair with no date is not a repair — it is the same intention that produced four months of a broken light, written down.',
  },
]

const preFix = tpl(
  {
    id: 'dd-pre-fix',
    name: 'The repair that removes the failure',
    skillIds: ['st-premortem'],
    bucket: STRAT,
    difficulty: 3,
    variants: FIX_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, FIX_CASES)
    return {
      title: 'Repair it, do not restate it',
      prompt: `${c.scene}\n\nThe pre-mortem found this: **${c.failure}**\n\nWhich change actually removes it?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask of each option: if I do this, can the failure still happen exactly as written?',
        'A real repair names something different about the world by a date. An intention names something different about you.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The test that separates a repair from a wish: point at what will be different, and say when. "Teach a second person this fortnight" passes; "be more flexible" cannot be pointed at, so nothing changes and the same pre-mortem would be written again next term.`,
    }
  },
)

const CLAIM_CASES: Choice[] = [
  {
    scene: '"We did the pre-mortem, so the plan is safe now."',
    correct: 'It listed ways this can fail; the plan changes only if you change it',
    wrong: [
      'Correct — naming the risks is what protects a plan against them',
      'Correct, and the exercise has been shown to make real decisions turn out better',
      'It was a wasted hour, because imagining failure only makes a group gloomy',
    ],
    tempt: '"Naming the risks protects the plan" tempts because the list feels like progress, and it is progress. It is a list. Nothing on it has been repaired until somebody changes a date, a person, or a number.',
  },
  {
    scene: '"Pre-mortems make groups about 30% better at planning."',
    correct: 'The study behind that number counted reasons listed, not better plans',
    wrong: [
      'Right, and the effect holds up in every setting where it has been tried',
      'Close enough — the figure is about groups rather than individuals',
      'Made up; no research has ever looked at this exercise at all',
    ],
    tempt: 'The "close enough" reading tempts because the number sounds specific and specific numbers feel checked. What was measured was how many reasons people generated when asked to imagine an outcome had already happened — a count, not a quality, and certainly not a decision that went better.',
  },
  {
    scene: '"There is no point — we already asked what might go wrong."',
    correct: 'Writing as if it already failed does surface more than asking does',
    wrong: [
      'True, the two questions are the same question in slightly different words',
      'True, and picturing failure makes a group lose faith in a good plan',
      'Right, and nothing about any of this has ever been measured',
    ],
    tempt: 'Treating the two questions as identical tempts because they sound identical. "What might go wrong" invites a shrug; "it is the day after and it failed" makes you explain something, and explaining produces more than listing.',
  },
  {
    scene: '"We came out of it much less confident, so it went badly."',
    correct: 'Lower confidence is the effect that was actually measured',
    wrong: [
      'Yes — a plan the group believes in less is a plan that goes worse',
      'Yes, and this exercise is known for demoralising the groups that run it',
      'No, groups reliably come out of a pre-mortem feeling more confident',
    ],
    tempt: 'The "believe in it less, do it worse" reading tempts because confidence feels like fuel. The one quantitative test of this exercise found reduced confidence and treated that as the finding — being less sure of a plan you have not yet repaired is accurate, not damaging.',
  },
  {
    scene: '"We found eleven ways it could fail, so we are eleven risks safer."',
    correct: 'You are safer on the ones you repaired, which is a smaller number',
    wrong: [
      'Correct — from now on a named risk is a managed risk',
      'Correct, and the length of the list is the measure of a good pre-mortem',
      'Not really; long lists of risks are known to make plans turn out worse',
    ],
    tempt: 'Counting the list tempts because it is the only number the exercise produces. Judging a pre-mortem by its length rewards writing eleven versions of the same worry, which is exactly what a group does when the count is the score.',
  },
  {
    scene: '"Nobody has proved it works, so we should not bother."',
    correct: 'It reliably produces more failure modes, and that is worth an hour',
    wrong: [
      'Right — an unproven method has no business in a serious plan',
      'Right, and the evidence that does exist points the other way entirely',
      'Wrong — it has been shown twice to improve real-world outcomes',
    ],
    tempt: '"Unproven, so drop it" tempts because it sounds rigorous. The honest position is narrower than either extreme: what is supported is that it generates more failure modes and lowers confidence, which is a cheap hour with a real output — and not a demonstration that decisions come out better.',
  },
  {
    scene: '"The pre-mortem told us the plan would fail."',
    correct: 'It tells you HOW a plan could fail, never whether it will',
    wrong: [
      'Right — predicting the failure is exactly what the exercise is for',
      'Right, and a plan with that many failure modes should be dropped',
      'Wrong; it gives you a percentage chance that the plan fails',
    ],
    tempt: '"A plan with that many failure modes should be dropped" tempts because the list looks like a verdict. Every plan has a long list available; the number you find depends on how hard you looked, which makes it a fact about the search, not about the plan.',
  },
  {
    scene: '"We should run one before every decision we make."',
    correct: 'It costs an hour, so it belongs on the plans that matter',
    wrong: [
      'Yes — the more of them you run, the better a planner you become',
      'Yes, because absolutely any decision can fail in a way you missed',
      'No; they are only ever worth doing for really large projects',
    ],
    tempt: '"Any decision can fail" tempts because it is true. It is also true of choosing a sandwich. The hour has to be worth spending, which points it at decisions that are expensive to reverse and cheap to improve now.',
  },
]

const preClaim = tpl(
  {
    id: 'dd-pre-claim',
    name: 'What a pre-mortem does, honestly',
    skillIds: ['st-premortem'],
    bucket: STRAT,
    difficulty: 4,
    variants: CLAIM_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CLAIM_CASES)
    return {
      title: 'Correct the claim',
      prompt: `Someone in the group says:\n\n> ${c.scene}\n\nWhich reply is the honest one?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Separate two different questions: what the exercise produces, and what it has been shown to change.',
        'Be as suspicious of the reply that dismisses it as of the reply that oversells it. Both skip the actual evidence.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The evidence, stated plainly so you can judge it yourself. The often-quoted "about 30% more reasons" comes from a 1989 study of prospective hindsight, and it counted how many reasons people generated when asked to imagine an outcome had already happened — the COUNT, not whether the reasons were any good. The only quantitative test of the group exercise as it is actually run is a 2010 conference paper with 178 students, which found people were less confident afterwards. So: more failure modes, and less overconfidence, in a lab. No study shows it makes real decisions turn out better, and this app will not tell you otherwise.`,
    }
  },
)

// ===========================================================================
// st-ethics — wins that survive daylight, and asks that leave a real choice
// ===========================================================================

const DAYLIGHT_CASES: (Choice & { goal: string })[] = [
  {
    goal: 'You want your design chosen for the club T-shirt.',
    scene: 'Three designs have been put forward and the club will pick one.',
    correct: 'Put all three up side by side and let the club vote',
    wrong: [
      'Post yours a day early so it is the one people have seen most',
      'Say the printer told you yours is the cheapest, which they did not',
      'Ask friends to vote early so it looks like it is winning',
    ],
    tempt: 'Posting early tempts because nothing about it is a lie. It still wins by making the comparison unfair rather than by making your design better, and the club would recognise that instantly if you described what you had done.',
  },
  {
    goal: 'You want the last place on the trip.',
    scene: 'One place is left and three people want it.',
    correct: 'Put your name down and say why you would use the place',
    wrong: [
      'Put your name down twice so one of them gets through',
      'Get in before it is announced, while the others do not know',
      'Say it clashes with the fixture for the other two, which it does not',
    ],
    tempt: 'Getting in before the announcement tempts because you did nothing except move fast. What you actually used was information the others were entitled to at the same time, and a decision made before people can be considered is not a decision about who should go.',
  },
  {
    goal: 'You want your song to close the concert.',
    scene: 'Three acts have asked for the closing slot.',
    correct: 'Play all three to the music teacher and take the verdict',
    wrong: [
      'Mention that one of the other acts is never on time',
      'Ask for the slot when the other two acts are not around',
      'Keep asking until it is easier to say yes than to keep refusing',
    ],
    tempt: 'Wearing people down tempts because nobody is deceived and nothing is hidden. It wins by making the decision about how tired the decider is, which is precisely why the result would embarrass you if it were described out loud.',
  },
  {
    goal: 'You want the pitch by the entrance for your stall.',
    scene: 'Four stalls want the two pitches nearest the door.',
    correct: 'Say what your stall needs the footfall for, and accept the call',
    wrong: [
      'Set up there early and be difficult to move once you are in',
      'Tell the organiser another stall has pulled out, before they have',
      'Agree to draw lots, then swap your ticket with somebody quietly',
    ],
    tempt: 'Setting up early tempts because it is not against any rule anyone wrote down. It converts a shared decision into a fact on the ground, and the organiser now has to have an argument to get back to where they started.',
  },
  {
    goal: 'You want to be made captain this season.',
    scene: 'The coach will name a captain after the trial matches.',
    correct: 'Play well, and organise the warm-ups nobody else volunteers for',
    wrong: [
      'Point out the other candidate\'s worst game whenever it comes up',
      'Suggest the vote happens on a day the other candidate is away',
      'Tell the squad the coach has already decided, so they stop thinking',
    ],
    tempt: 'Mentioning the other candidate\'s worst game tempts because it is a true fact. Selecting which true facts reach a decider is how a case gets built out of honest pieces and still ends up crooked — and it is the version that gets repeated back to you in a small squad.',
  },
  {
    goal: 'You want to work with a particular lab partner.',
    scene: 'The teacher is about to let people pair up.',
    correct: 'Ask them first, and take a no without making it awkward',
    wrong: [
      'Ask them in front of everyone so refusing looks unfriendly',
      'Tell the person they usually pair with that you are already paired',
      'Wait until nobody else is left, so there is nothing else to choose',
    ],
    tempt: 'Asking in front of everyone tempts because it is a completely ordinary thing to do. Notice what the audience adds: it makes "no" expensive, which is a way of getting a yes that is not the same as being chosen.',
  },
  {
    goal: 'You want the club budget spent on the equipment you use.',
    scene: 'The committee is deciding between two things to buy.',
    correct: 'Bring the numbers on how often each one gets used',
    wrong: [
      'Bring it up in the meeting the other group cannot attend',
      'Say the equipment is unsafe when it is only a bit worn',
      'Get four friends to join the club the week before the vote',
    ],
    tempt: 'Recruiting four friends before the vote tempts because joining a club is not wrong. Joining to change a vote is stacking the room, and it works by making the membership a tool rather than a group of people with a view.',
  },
  {
    goal: 'You want to win the photography prize.',
    scene: 'Entries are judged anonymously by two teachers.',
    correct: 'Enter your strongest picture and let it be judged blind',
    wrong: [
      'Enter under a friend\'s name as well, to have two chances',
      'Mention which entry is yours to one of the judges beforehand',
      'Post yours online first so the judges will recognise the picture',
    ],
    tempt: 'Posting it online first tempts because it is your own picture on your own account. It is also a way of removing the anonymity everyone else is being judged under, which is the one thing the format was for.',
  },
  {
    goal: 'You want a place on the quiz team.',
    scene: 'Six people are trying out for four places.',
    correct: 'Practise the rounds you are weakest at and try out properly',
    wrong: [
      'Get the practice questions early from someone who has seen them',
      'Tell one of the others the try-out has moved to a later date',
      'Make sure the coach hears you were the best on the last team',
    ],
    tempt: 'Getting the questions early tempts because you would still have to answer them. You would be answering a different, easier test than everybody else, so the result stops measuring the thing the try-out was measuring.',
  },
  {
    goal: 'You want the fundraiser to back the cause you care about.',
    scene: 'The year group will vote between four causes.',
    correct: 'Make the case in two minutes and let the vote settle it',
    wrong: [
      'Say one of the other causes has already had money this year',
      'Put your cause at the top of the list, where eyes land first',
      'Count the votes yourself and round the close ones your way',
    ],
    tempt: 'Putting your cause at the top tempts because somebody has to be first on a list. Choosing to be first because it wins votes is using the format rather than the argument — and the giveaway is that you would not say out loud why you put it there.',
  },
]

const ethDaylight = tpl(
  {
    id: 'dd-eth-daylight',
    name: 'Would it still work in daylight?',
    skillIds: ['st-ethics'],
    bucket: STRAT,
    difficulty: 3,
    variants: DAYLIGHT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, DAYLIGHT_CASES)
    return {
      title: 'Win it in the open',
      prompt: `GOAL: ${c.goal}\n\n${c.scene}\n\nWhich route wins by making your case better, rather than by making someone else's worse?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Test each one: does it work by improving what you offer, or by degrading the decision itself?',
        'Then run the daylight check — would it still work if everyone involved watched you do it and knew why?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The practical argument, separate from the moral one: strategies that need darkness turn every person who notices into a risk you have to manage. In a school, a club or a family, that is everybody, and it lasts for years. The honest route wins less often in the short run and costs nothing to be seen doing, which is why it compounds.`,
    }
  },
)

const AGENCY_CASES: Choice[] = [
  {
    scene: 'You need someone to swap a Saturday shift with you.',
    correct: 'Message one person early, and say that no is completely fine',
    wrong: [
      'Ask in front of everyone at once, so that refusing would look bad',
      'Ask the person you covered for last month, mentioning that you did',
      'Ask on Friday evening, when there is nobody else left for them to suggest',
    ],
    tempt: 'Reminding them you covered for them tempts because it is true and it feels fair. It converts a favour you gave freely into a debt they now owe, and a yes you collected that way tells you nothing about whether they were free.',
  },
  {
    scene: 'You want a friend to come to something they might not enjoy.',
    correct: 'Say honestly what it is, and that either answer is genuinely fine',
    wrong: [
      'Mention only the parts they will like',
      'Say that everyone else is going, so they will not want to miss out',
      'Buy them a ticket first, then tell them you have already got them one',
    ],
    tempt: 'Buying the ticket first tempts because it looks generous. It makes refusing cost them money and makes you the person they let down, which is a way of removing a choice while appearing to give a gift.',
  },
  {
    scene: 'You want to borrow something of a friend\'s that matters to them.',
    correct: 'Ask, say what could go wrong, and leave them an easy way out',
    wrong: [
      'Ask them while they are in the middle of doing something else',
      'Point out that you lent them yours last term, so they owe you one',
      'Ask in front of other people, so that saying no would look mean of them',
    ],
    tempt: 'Asking while they are busy tempts because it seems harmless and it is quick. A question answered without attention is not a decision, and you will both find that out when it matters.',
  },
  {
    scene: 'You want a parent to agree to a later night than usual.',
    correct: 'Ask in advance, give the actual plan, and take either answer',
    wrong: [
      'Ask as they are walking out of the door, with your coat already on',
      'Ask while there are guests in, when refusing would be awkward',
      'Say everyone else is allowed to, without having checked whether they are',
    ],
    tempt: 'Asking in front of guests tempts because people are more agreeable in company. That is the whole mechanism: you are not getting a yes to the plan, you are getting a yes to not having a scene, and it is usually withdrawn afterwards.',
  },
  {
    scene: 'You want someone to take a job on the committee.',
    correct: 'Say what the job really takes, and that no is a real answer',
    wrong: [
      'Ask them in the middle of a meeting, in front of everyone',
      'Tell them nobody else will do it and the club folds without them',
      'Put their name on the list first and mention it to them afterwards',
    ],
    tempt: '"The club folds without you" tempts because it may even be true. True or not, it hands them responsibility for an outcome instead of a decision about their own time, and people who say yes to that leave within a term.',
  },
  {
    scene: 'You want your group to choose the topic you prefer.',
    correct: 'Say what you think and ask each of them what they think',
    wrong: [
      'Say it louder each time until they stop arguing',
      'Ask whether anybody objects, which makes disagreeing an act of conflict',
      'Decide it, tell them it is decided, and let them raise it if they mind',
    ],
    tempt: '"Does anyone object?" tempts because it sounds like consultation and it is nearly free. Objecting costs more than answering, so what comes back is silence, and silence gets recorded as agreement.',
  },
  {
    scene: 'You want a classmate to swap seats with you.',
    correct: 'Ask them quietly, say why, and accept it if the answer is no',
    wrong: [
      'Move your things onto that desk before they arrive in the morning',
      'Ask the teacher to move them, rather than asking the person at all',
      'Tell them you get a headache at the back, when it is that you want the window',
    ],
    tempt: 'Going to the teacher tempts because it avoids an awkward conversation. It also settles a question about someone\'s seat without them being in the room, which is the part they will mind about, not the seat.',
  },
  {
    scene: 'You want a friend to help with a job that will take a whole afternoon.',
    correct: 'Say how long it will take, and ask with enough notice to refuse',
    wrong: [
      'Say it will be quick, and let them find out',
      'Ask them once they have already turned up and are standing there',
      'Ask in the group chat where everyone can see who did and did not offer',
    ],
    tempt: 'Understating the length tempts because they would probably say yes to a short job. That is exactly why it is not consent: they agreed to a job that does not exist, and the real one gets extracted an hour at a time.',
  },
]

const ethAgency = tpl(
  {
    id: 'dd-eth-agency',
    name: 'The ask that leaves them a real no',
    skillIds: ['st-ethics'],
    bucket: STRAT,
    difficulty: 3,
    variants: AGENCY_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, AGENCY_CASES)
    return {
      title: 'Ask so that no is cheap',
      prompt: `${c.scene}\n\nAll four of these would probably get you a yes. Which one gets a yes you can trust?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'For each option, ask what saying no would cost the other person — in money, in looking bad, in an argument.',
        'A yes is only information if a no was available at about the same price.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `This is worth having as a habit in both directions. Outward: an agreement squeezed out of somebody is unreliable, resented, and usually has to be squeezed again — so the honest ask is also the one that works. Inward: it is the same list of levers people use on you, which is why noticing "refusing this would be expensive for me right now" is a reason to answer later rather than a reason to say yes.`,
    }
  },
)

const SPEND_CASES: { plan: string; theirs: string[]; yours: string[] }[] = [
  {
    plan: 'You will tell the group you finished your section, then work on it over the weekend so it is ready by Monday.',
    theirs: [
      'The group\'s ability to plan around what is actually done',
      'Your own word, next time you say a section is finished',
      'The evening someone else will spend redoing work they think is missing',
    ],
    yours: ['Your weekend', 'Your own free time on Sunday', 'The effort of finishing the section'],
  },
  {
    plan: 'You will borrow your brother\'s bike for the week without asking, and put it back before he notices.',
    theirs: [
      'His use of his own bike, on any day he happens to want it',
      'His say in whether it gets ridden in the rain',
      'The trust that lets you borrow things by asking, later on',
    ],
    yours: ['Your time cycling', 'The energy of riding in each morning', 'Your own effort keeping it clean'],
  },
  {
    plan: 'You will put a friend down as a helper on the stall rota, since they usually say yes anyway.',
    theirs: [
      'Their Saturday, which they have not agreed to give up',
      'Their standing with the organiser if they now pull out',
      'Their right to be asked rather than assigned',
    ],
    yours: ['Your time filling in the rota', 'The two minutes of writing it out', 'Your own shift on the same stall'],
  },
  {
    plan: 'You will tell the teacher the group has agreed on the topic, and tell the group afterwards.',
    theirs: [
      'The group\'s vote, which has not happened yet',
      'Their standing with the teacher if they now disagree',
      'The chance for anyone else to make a case for a different topic',
    ],
    yours: ['Your time talking to the teacher', 'The walk to the staff room', 'Your own preference about the topic'],
  },
  {
    plan: 'You will share the group chat screenshot with someone outside the group, because it is funny.',
    theirs: [
      'The privacy of everyone who wrote in that chat',
      'Their control over who reads something they wrote to six people',
      'The group\'s willingness to say anything honest in there again',
    ],
    yours: ['Your own messages in the screenshot', 'The seconds it takes to send it', 'Your own reputation for discretion'],
  },
  {
    plan: 'You will promise the club a lift for six people on Saturday, on the assumption that your dad will drive.',
    theirs: [
      'Your dad\'s Saturday, which he has not been asked about',
      'His car, and the fuel that goes into it',
      'The club\'s plans, if the lift turns out not to exist',
    ],
    yours: ['Your own place in the car', 'The time you spend organising it', 'Your own Saturday morning'],
  },
  {
    plan: 'You will hand in the project a day late and say the printer at home broke.',
    theirs: [
      'The teacher\'s ability to believe the next real excuse',
      'The position of classmates who handed in on time',
      'Every future extension anyone in the class asks for honestly',
    ],
    yours: ['Your extra day of work', 'The evening you spend finishing it', 'Your own marks if it is still weak'],
  },
  {
    plan: 'You will volunteer your friend\'s house for the study session, because it is the quietest.',
    theirs: [
      'Their family\'s evening, which nobody has asked about',
      'Their say over who comes into their home',
      'The awkwardness they carry if they now have to say no',
    ],
    yours: ['Your travel across town', 'The time you spend revising there', 'Your own share of the tidying up'],
  },
]

const ethSpend = tpl(
  {
    id: 'dd-eth-spend',
    name: 'What the plan spends that is not yours',
    skillIds: ['st-ethics'],
    bucket: STRAT,
    difficulty: 4,
    variants: SPEND_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, SPEND_CASES)
    return {
      title: 'Price the whole plan',
      prompt:
        `PLAN: ${c.plan}\n\n` +
        `Every plan spends something. Select each item below that this plan spends **without the owner having agreed to it**.`,
      answer: multi(rng, c.theirs, c.yours),
      hints: [
        'Go through each item and ask whose it is, and whether that person said yes.',
        'Three of these are yours to spend however you like. The others belong to somebody who has not been in the conversation.',
        `Worked path: ${c.theirs.join('; ')}.`,
      ],
      explanation:
        `Spent without agreement: ${c.theirs.join('; ')}. The rest are yours, and spending your own time or effort on a plan is exactly what plans are for.\n\n` +
        `The reason to list them separately is that the second column is invisible in the moment. A plan that costs you a weekend feels expensive and a plan that costs somebody else a Saturday feels free, because the bill does not arrive where you can see it. Writing both columns is also how you find the honest version, which is usually one question away: ask, and the same plan either becomes legitimate or turns out not to have been available.`,
    }
  },
)

// ===========================================================================
// st-ev — expected value, and the case where a threshold overrules it
// ===========================================================================

interface BranchCase {
  scene: string
  risky: string
  good: string
  bad: string
  safe: string
}

const BRANCH_CASES: BranchCase[] = [
  {
    scene: 'The club has one Saturday to raise money and can only run one thing.',
    risky: 'the outdoor stall',
    good: 'it stays dry',
    bad: 'it rains',
    safe: 'the indoor cake sale',
  },
  {
    scene: 'The team can run one fundraiser before the end of term.',
    risky: 'the book stall at the market',
    good: 'the market is busy',
    bad: 'the market is quiet',
    safe: 'washing cars on the street',
  },
  {
    scene: 'The drama group can put its effort into one of two things.',
    risky: 'selling tickets on the door',
    good: 'the night is well attended',
    bad: 'the night is thin',
    safe: 'the fixed fee from the hall',
  },
  {
    scene: 'The allotment group can plant one of two crops in the free bed.',
    risky: 'the fast crop',
    good: 'the summer is warm',
    bad: 'the summer is cold',
    safe: 'the steady crop',
  },
  {
    scene: 'The club can put its stand at one of two places on fair day.',
    risky: 'the far field',
    good: 'the parade comes past',
    bad: 'the parade is rerouted',
    safe: 'the pitch by the gate',
  },
  {
    scene: 'The choir can accept one of two bookings for the same evening.',
    risky: 'the open-air concert',
    good: 'the evening is fine',
    bad: 'the evening is wet',
    safe: 'the community centre slot',
  },
]

const evBranches = tpl(
  {
    id: 'dd-ev-branches',
    name: 'Average out the two branches',
    skillIds: ['st-ev'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, BRANCH_CASES)
    const p = rint(rng, 3, 7)
    const hi = rint(rng, 12, 26) * 10
    const lo = rint(rng, 2, 8) * 10
    const ev = (p * hi + (10 - p) * lo) / 10
    // Seed parity decides which option wins, so neither "take the sure thing"
    // nor "take the gamble" is a strategy that beats this template.
    const riskyWins = seed % 2 === 0
    const gap = rint(rng, 2, 8) * 5
    const sure = riskyWins ? ev - gap : ev + gap
    const key = riskyWins
      ? `${c.risky.charAt(0).toUpperCase() + c.risky.slice(1)} — ${money(ev)} on average beats ${money(sure)}`
      : `${c.safe.charAt(0).toUpperCase() + c.safe.slice(1)} — ${money(sure)} beats an average of ${money(ev)}`
    const other = riskyWins
      ? `${c.safe.charAt(0).toUpperCase() + c.safe.slice(1)} — a sure ${money(sure)} is worth more than a gamble`
      : `${c.risky.charAt(0).toUpperCase() + c.risky.slice(1)} — its best case is the biggest number here`

    return {
      title: 'Which one, on the numbers?',
      prompt:
        `${c.scene}\n\n` +
        `- **${c.risky.charAt(0).toUpperCase() + c.risky.slice(1)}** — a ${p * 10}% chance the ${c.good}, and it takes ${money(hi)}; otherwise ${c.bad} and it takes ${money(lo)}\n` +
        `- **${c.safe.charAt(0).toUpperCase() + c.safe.slice(1)}** — ${money(sure)}, whatever the weather does\n\n` +
        `Both are run once, and the club will do this kind of thing many times over the years.`,
      parts: [
        {
          stage: 'Average',
          prompt: `What is the average takings of ${c.risky}, in dollars?`,
          answer: numeric(ev),
          explanation:
            `(${p * 10}% × ${money(hi)}) + (${(10 - p) * 10}% × ${money(lo)}) = ${money((p * hi) / 10)} + ${money(((10 - p) * lo) / 10)} = **${money(ev)}**. ` +
            `Both branches go in, including the bad one. Averaging only the outcome you are hoping for is the commonest way this sum goes wrong.`,
          hints: [
            'Multiply each outcome by its chance, then add the two results.',
            `${p * 10}% of ${money(hi)}, plus ${(10 - p) * 10}% of ${money(lo)}.`,
            `${money((p * hi) / 10)} + ${money(((10 - p) * lo) / 10)} = **${money(ev)}**.`,
          ],
        },
        {
          stage: 'Choose',
          prompt: 'On these numbers, which should the club run?',
          answer: mcq(rng, key, [
            other,
            `Whichever the committee has people spare for`,
            `Neither — one Saturday is too small a sample to decide anything`,
          ]),
          explanation:
            `**${key}**. The comparison is between ${money(ev)} and ${money(sure)}, and nothing else on the page changes it.\n\n` +
            `${riskyWins ? `The sure option is tempting because ${money(sure)} is certain and certainty feels like value. It is worth something — but here it costs ${money(gap)} of average takings to buy, and a club that will run dozens of these over the years is exactly the case where paying that every time adds up.` : `The gamble is tempting because ${money(hi)} is the biggest number on the page. Best cases are not what you get; you get the average, and here the average is ${money(gap)} below the certain option.`}`,
          hints: [
            'You have one number for each option now. Put them side by side.',
            'The biggest single number on the page belongs to one branch of one option, not to the option.',
            `Worked path: ${money(ev)} against ${money(sure)}.`,
          ],
        },
        {
          stage: 'Careful',
          prompt: 'What does that average NOT promise about this particular Saturday?',
          answer: mcq(rng, 'The day itself will land on one of the two amounts, not the average', [
            'That the chance given for the weather is the right one',
            'That the club will end up better off than it started',
            'That the numbers were worked out by somebody who knew what they were doing',
          ]),
          explanation:
            `An average is a summary of many repeats, and this Saturday is one repeat: the club will take ${money(hi)} or ${money(lo)}, and never ${money(ev)}. That is not a reason to ignore the average — over many decisions it is the number that comes true — but it does mean a single bad Saturday is not evidence that the choice was wrong.\n\n` +
            `The other options are all real worries about a calculation like this, and they are worries about the INPUTS. If the ${p * 10}% is a guess, the average inherits the guess. Averages are as good as the numbers put into them and no better.`,
          hints: [
            'Ask what you would actually see on the day, and whether the average is one of the things you could see.',
            'Three of these are doubts about where the numbers came from. One is about what an average is.',
            'Worked path: the day pays one of the two branch amounts, never the average of them.',
          ],
        },
      ],
      hints: [
        'Average = chance × amount, added over both branches.',
        'Then compare that single number with the certain amount.',
        `Worked path: ${money(ev)} on average against a certain ${money(sure)}.`,
      ],
      explanation:
        `The average for ${c.risky} is (${p * 10}% × ${money(hi)}) + (${(10 - p) * 10}% × ${money(lo)}) = **${money(ev)}**, against a certain **${money(sure)}**.\n\n` +
        `Expected value is a ranking tool for decisions you make repeatedly, and the club does make this kind of decision repeatedly, which is what licenses it here. Two things it does not do: it says nothing about what happens on the day, and it treats a bad outcome that the club could absorb the same as one that would end the club. When a single bad result would be unrecoverable, the average stops being the right boss.`,
    }
  },
)

const ENTRY_CASES: { scene: string; prize: string; cost: string }[] = [
  { scene: 'The club is deciding whether to enter the regional design competition.', prize: 'the winning club gets', cost: 'the entry fee is' },
  { scene: 'The team is deciding whether to enter the county quiz final.', prize: 'the winning team gets', cost: 'entering costs' },
  { scene: 'The garden group is deciding whether to enter the borough show.', prize: 'first place is worth', cost: 'the entry costs' },
  { scene: 'The band is deciding whether to enter the young musicians\' award.', prize: 'the winner receives', cost: 'the entry fee is' },
  { scene: 'The drama group is deciding whether to enter the one-act festival.', prize: 'the winning group gets', cost: 'entering costs' },
  { scene: 'The photography club is deciding whether to enter the open exhibition.', prize: 'the top prize is', cost: 'the entry fee is' },
]

const evEntry = tpl(
  {
    id: 'dd-ev-entry',
    name: 'Is the entry fee worth it?',
    skillIds: ['st-ev'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ENTRY_CASES)
    const entrants = rint(rng, 4, 12)
    const perShare = rint(rng, 4, 20) * 5
    const prize = perShare * entrants
    const fee = rint(rng, 2, 16) * 5
    const net = perShare - fee
    return {
      title: 'Average it out, then subtract',
      prompt:
        `${c.scene}\n\n` +
        `About **${entrants} groups** enter each year and they are all much of a muchness, so the club's chance is roughly **1 in ${entrants}**. If it wins, ${c.prize} **${money(prize)}**. Either way ${c.cost} **${money(fee)}**, and that is not returned.\n\n` +
        `What is entering worth on average, in dollars? A negative answer is a real answer.`,
      answer: numeric(net),
      hints: [
        'Average value of the prize first: the amount, shared over the number of entrants.',
        `${money(prize)} ÷ ${entrants} = ${money(perShare)}. Now take off the fee, which is paid whatever happens.`,
        `${money(perShare)} − ${money(fee)} = **${net < 0 ? `−${money(-net)}` : money(net)}**.`,
      ],
      explanation:
        `The prize is worth ${money(prize)} ÷ ${entrants} = ${money(perShare)} on average, and the fee of ${money(fee)} is paid in every world, so entering is worth **${net < 0 ? `−${money(-net)}` : money(net)}** on average.\n\n` +
        `${net >= 0 ? 'On the money alone this is worth entering, and it is worth noticing how little that means on its own: the club will almost certainly get nothing, because "almost certainly nothing" and "worth it on average" are perfectly compatible when the prize is large.' : 'On the money alone this loses, and clubs enter competitions like this all the time anyway — for the practice, the deadline, the day out. That is a perfectly good reason. What it is not is a money argument, and the honest version is to say which of the two you are buying.'}\n\n` +
        `The 1-in-${entrants} figure is the soft part of this sum. It assumes every entrant is equally likely to win, which is almost never true — and the direction of the error is not obvious, because a club that thinks it is better than average is usually not the only one thinking that.`,
    }
  },
)

const NEED_CASES: { scene: string; steady: string; bold: string; unit: string; bar: string }[] = [
  { scene: 'The last round of the inter-school quiz, and one question is left.', steady: 'the safe answer', bold: 'the risky answer', unit: 'points', bar: 'to reach the final' },
  { scene: 'The final event of the sports day, with one jump left.', steady: 'the safe approach', bold: 'the long run-up', unit: 'points', bar: 'to win the cup' },
  { scene: 'The last stall of the fundraiser, and one hour left to sell.', steady: 'the steady stock', bold: 'the risky stock', unit: 'dollars', bar: 'to cover the coach' },
  { scene: 'The last week of the reading challenge, with one book to log.', steady: 'the short book', bold: 'the long book', unit: 'points', bar: 'to reach the badge' },
  { scene: 'The final match of the season, with one tactic to choose.', steady: 'playing it safe', bold: 'going for the win', unit: 'points', bar: 'to stay up' },
  { scene: 'The last round of the chess tournament, and one game left.', steady: 'the solid line', bold: 'the sharp line', unit: 'points', bar: 'to take a prize' },
]

const evNeed = tpl(
  {
    id: 'dd-ev-need',
    name: 'When the average is not the boss',
    skillIds: ['st-ev'],
    bucket: STRAT,
    difficulty: 4,
    variants: 12,
    minutes: 3.5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, NEED_CASES)
    const steadyClears = seed % 2 === 0
    const steady = rint(rng, 4, 10) * 5
    const need = steadyClears ? steady - rint(rng, 1, 3) * 5 : steady + rint(rng, 1, 4) * 5
    // When the certain route already clears the bar, the gamble is built to
    // have the HIGHER average and still be wrong. When it cannot, the gamble is
    // built to have the LOWER average and still be right.
    const p = steadyClears ? rint(rng, 6, 8) : rint(rng, 3, 4)
    const bold = steadyClears ? Math.round((steady * 2) / 5) * 5 : need + rint(rng, 0, 3) * 5
    const evBold = (p * bold) / 10
    const key = steadyClears
      ? `Play ${c.steady} — its ${steady} already clears the ${need}`
      : `Play ${c.bold} — only it can reach ${need} at all`
    const wrong = steadyClears
      ? [
          `Play ${c.bold} — an average of ${evBold} is the bigger number`,
          `Toss a coin — the two are close enough to be equal`,
          `Play ${c.bold}, because its best case is the biggest number on the page`,
        ]
      : [
          `Play ${c.steady} — an average of ${steady} is the bigger number`,
          `Toss a coin — the two are close enough to be equal`,
          `Play ${c.steady}, because a certain score is always the safer choice`,
        ]

    return {
      title: 'One attempt, and a bar to clear',
      prompt:
        `${c.scene} You need **${need} ${c.unit}** ${c.bar}, and you get exactly one attempt.\n\n` +
        `- **${c.steady.charAt(0).toUpperCase() + c.steady.slice(1)}** — ${steady} ${c.unit}, certain\n` +
        `- **${c.bold.charAt(0).toUpperCase() + c.bold.slice(1)}** — ${p === 8 ? 'an' : 'a'} ${p * 10}% chance of ${bold} ${c.unit}, and nothing at all otherwise`,
      parts: [
        {
          stage: 'Average',
          prompt: `What is the average score of ${c.bold}, in ${c.unit}?`,
          answer: numeric(evBold, { tolerance: 0.005 }),
          explanation:
            `${p * 10}% × ${bold} = **${evBold}**. The miss contributes nothing, so there is only one product to work out — which is exactly why an average like this is so easy to reach for and so easy to over-trust.`,
          hints: [
            'Chance times payoff. The failure branch scores zero, so it adds nothing.',
            `${p / 10} × ${bold}.`,
            `${p * 10}% of ${bold} = **${evBold}**.`,
          ],
        },
        {
          stage: 'Choose',
          prompt: 'You get one attempt. Which do you play?',
          answer: mcq(rng, key, wrong),
          explanation:
            `**${key}**.\n\n` +
            `${steadyClears
              ? `Look at what the average would have told you: ${evBold} beats ${steady}, so on average the gamble scores more. It is still the wrong play, because there is no average being collected. There is one attempt and a bar at ${need}, and ${c.steady} clears it every single time while ${c.bold} misses it ${(10 - p) * 10}% of the time and scores nothing at all.`
              : `Look at what the average would have told you: ${steady} beats ${evBold}, so on average the steady route scores more. It is still the wrong play, because ${steady} is below the ${need} you need — a route that cannot reach the bar has a value of zero here, however reliable it is. A ${p * 10}% chance of getting there beats a certainty of not getting there.`}`,
          hints: [
            'Before comparing averages, ask of each route: can it reach the bar at all?',
            'Then ask how often it reaches it. With one attempt, "how often" is the whole question.',
            `Worked path: the bar is ${need}; ${c.steady} scores ${steady}, ${c.bold} scores ${bold} or nothing.`,
          ],
        },
        {
          stage: 'The rule',
          prompt: 'So when IS the average the right thing to compare?',
          answer: mcq(rng, 'When you get many goes and no single result has to clear a bar', [
            'When the numbers involved are large enough to be worth the effort',
            'When you can work out the chances accurately rather than guessing them',
            'Whenever a decision has to be made with numbers rather than on a feeling',
          ]),
          explanation:
            `Two conditions, and both are needed. Many goes, so the average is actually collected rather than merely calculated — and no threshold, so more is simply better and there is no cliff to fall off.\n\n` +
            `Knowing which of the two situations you are in is the skill, and it is a question about the SITUATION, not about the arithmetic. The same numbers with a bar under them and the same numbers with no bar have different right answers, which is why the sum alone can never tell you what to do.`,
          hints: [
            'Think about what has to be true for an average to actually happen to you.',
            'Then think about what a bar does to "more is better".',
            'Worked path: many repeats, and no single result that has to clear a threshold.',
          ],
        },
      ],
      hints: [
        'Work out the average of the risky route first, then ignore it for a moment.',
        'Ask instead which routes can clear the bar at all, and how often.',
        `Worked path: bar ${need}; ${c.steady} gives ${steady} for certain; ${c.bold} gives ${bold} with probability ${p / 10}.`,
      ],
      explanation:
        `The average of ${c.bold} is ${p * 10}% × ${bold} = **${evBold}**, against a certain **${steady}** — and the right play is **${key}**.\n\n` +
        `This is the case that trips people who have just learned expected value, because it is the case where the bigger average is the wrong answer. A threshold changes what "better" means: below the bar, every score is worth the same as zero, so the question stops being "how much on average?" and becomes "how often do I clear it?". Both directions appear in this family — sometimes the bar makes the certain route right, sometimes it makes the gamble right — because a rule that always said "play safe" would not be a rule about thresholds at all.`,
    }
  },
)

const REPEAT_CASES: { scene: string; item: string; sells: string; unsold: string }[] = [
  { scene: 'The school shop is deciding what to stock for the term.', item: 'each fresh roll', sells: 'it sells by lunchtime', unsold: 'it goes in the bin' },
  { scene: 'The club stall is deciding what to order for the season.', item: 'each printed shirt', sells: 'it sells at a match', unsold: 'it sits in the box' },
  { scene: 'The garden group is deciding what to grow to sell.', item: 'each tray of plants', sells: 'it sells on the day', unsold: 'it is given away' },
  { scene: 'The cafe run by the sixth form is planning its orders.', item: 'each sandwich', sells: 'it sells before two', unsold: 'it is thrown out' },
  { scene: 'The book stall is deciding how to price its stock.', item: 'each second-hand book', sells: 'it finds a buyer', unsold: 'it goes back to storage' },
  { scene: 'The bake sale team is deciding what to make each week.', item: 'each iced bun', sells: 'it sells at break', unsold: 'it is left over' },
]

const evRepeat = tpl(
  {
    id: 'dd-ev-repeat',
    name: 'The number you get when you do it often',
    skillIds: ['st-ev'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, REPEAT_CASES)
    let p = 7
    let gain = 80
    let loss = 40
    // Redrawn until the per-item average is not zero: an item whose answer is
    // "it breaks even exactly" makes both numeric boxes the same and teaches
    // nothing about the decision the club is actually facing.
    for (let tries = 0; tries < 200; tries++) {
      const cp = rint(rng, 5, 9)
      const cg = rint(rng, 3, 12) * 10
      const cl = rint(rng, 2, 9) * 10
      if (cp * cg === (10 - cp) * cl) continue
      p = cp
      gain = cg
      loss = cl
      break
    }
    // Everything stays in whole cents and is divided once, so no float dust.
    const perItemCents = (p * gain - (10 - p) * loss) / 10
    const perItem = round(perItemCents / 100, 2)
    const count = rint(rng, 4, 12) * 10
    const total = round((perItemCents * count) / 100, 2)

    return {
      title: 'Per item, then per term',
      prompt:
        `${c.scene}\n\n` +
        `For ${c.item}: **${p * 10}%** of the time ${c.sells} and the club is **${money(gain / 100)}** up; otherwise ${c.unsold} and the club is **${money(loss / 100)}** down.\n\n` +
        `The club will handle **${count}** of them this term.`,
      parts: [
        {
          stage: 'Per item',
          prompt: 'What is the average result per item, in dollars?',
          answer: numeric(perItem, { tolerance: 0.005 }),
          explanation:
            `(${p * 10}% × ${money(gain / 100)}) − (${(10 - p) * 10}% × ${money(loss / 100)}) = **${money(perItem)}** per item. Both branches count, and the losing branch counts as a subtraction rather than as a zero — a wasted item costs money, it does not merely fail to earn any.`,
          hints: [
            'Chance of selling times the gain, minus chance of not selling times the loss.',
            `${p * 10}% of ${money(gain / 100)}, then take off ${(10 - p) * 10}% of ${money(loss / 100)}.`,
            `Worked path: **${money(perItem)}** per item.`,
          ],
        },
        {
          stage: 'Per term',
          prompt: `And across all ${count} of them, in dollars?`,
          answer: numeric(total, { tolerance: 0.05 }),
          explanation:
            `${money(perItem)} × ${count} = **${money(total)}**. This is the number expected value was built for: a decision repeated many times, where the run really does average out and the total is what the club actually banks.`,
          hints: [
            'Multiply the per-item average by how many there will be.',
            `${money(perItem)} × ${count}.`,
            `${money(perItem)} × ${count} = **${money(total)}**.`,
          ],
        },
        {
          stage: 'Read it',
          prompt: `What does the ${money(total)} actually claim?`,
          answer: mcq(rng, 'A fair guess at the term\'s total, and no promise about any one item', [
            'That the club banks that amount, give or take a few dollars',
            'That every item sold makes the club money on its own',
            'That the club is certain to be better off doing this than not doing it at all',
          ]),
          explanation:
            `The total is a central estimate of a run of ${count} tries, and the run will land somewhere around it rather than on it. "Give or take a few dollars" is the tempting wrong answer because it sounds appropriately modest — the spread on ${count} tries is wider than a few dollars, and how much wider depends on the size of the two branch amounts.\n\n` +
            `What makes this a legitimate use of an average, unlike a one-off with a threshold: ${count} repeats is enough that the run genuinely averages out, and no single item can sink the club.`,
          hints: [
            'An average of many tries is a central guess, not a guarantee.',
            'Two of the options quietly claim more certainty than a chance calculation can carry.',
            'Worked path: it is a fair guess at the total, and it promises nothing about any single item.',
          ],
        },
      ],
      hints: [
        'Do one item first: chance times gain, minus chance times loss.',
        'Then multiply by how many items there will be.',
        `Worked path: ${money(perItem)} each, ${count} of them, so ${money(total)}.`,
      ],
      explanation:
        `Per item the average is **${money(perItem)}**, and across ${count} items that is **${money(total)}**.\n\n` +
        `This is expected value in the setting it belongs to: many repeats, no threshold, and no single result that could end the activity. In that setting the average is not a rough guide, it is close to what happens — and the club can compare two stocking plans by one number each and be right most of the time.`,
    }
  },
)

// ===========================================================================
// st-tradeoff — the requirement a weighted score cannot see
// ===========================================================================

interface DealCase {
  scene: string
  noun: string
  crits: [string, string, string]
  req: string
  unit: string
  lo: number
  hi: number
}

const DEAL_CASES: DealCase[] = [
  {
    scene: 'Four halls the club could hire for its showcase.',
    noun: 'Hall',
    crits: ['how it looks', 'cost', 'how easy it is to reach'],
    req: 'it must seat at least',
    unit: 'people',
    lo: 90,
    hi: 190,
  },
  {
    scene: 'Four second-hand laptops for the club\'s editing work.',
    noun: 'Laptop',
    crits: ['speed', 'screen', 'condition'],
    req: 'it must have at least',
    unit: 'GB of storage',
    lo: 120,
    hi: 460,
  },
  {
    scene: 'Four coaches the team could book for the away trip.',
    noun: 'Coach',
    crits: ['comfort', 'price', 'the driver\'s reviews'],
    req: 'it must carry at least',
    unit: 'passengers',
    lo: 28,
    hi: 62,
  },
  {
    scene: 'Four flats the drama group could rent for the festival week.',
    noun: 'Flat',
    crits: ['how nice it is', 'price', 'how close it is'],
    req: 'it must sleep at least',
    unit: 'people',
    lo: 5,
    hi: 12,
  },
  {
    scene: 'Four printers quoting for the club\'s programme.',
    noun: 'Quote',
    crits: ['print quality', 'price', 'how helpful they were'],
    req: 'it must deliver at least',
    unit: 'copies',
    lo: 220,
    hi: 700,
  },
]

const dealBreaker = tpl(
  {
    id: 'dd-trade-dealbreaker',
    name: 'The requirement the total cannot see',
    skillIds: ['st-tradeoff'],
    bucket: STRAT,
    difficulty: 4,
    variants: 10,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, DEAL_CASES)
    // Draw until the totals are all different, so "highest total" and "best of
    // the ones that qualify" each name exactly one row.
    let scores: number[][] = [
      [8, 7, 6],
      [7, 6, 6],
      [6, 6, 5],
      [5, 5, 5],
    ]
    for (let tries = 0; tries < 400; tries++) {
      const draw = Array.from({ length: 4 }, () => [rint(rng, 3, 10), rint(rng, 3, 10), rint(rng, 3, 10)])
      const totals = draw.map((r) => r[0] + r[1] + r[2])
      if (new Set(totals).size === 4) {
        scores = draw
        break
      }
    }
    const totals = scores.map((r) => r[0] + r[1] + r[2])
    const order = [...totals.keys()].sort((a, b) => totals[b] - totals[a])
    const threshold = rint(rng, Math.round(c.lo / 10), Math.round(c.hi / 20)) * 10
    // The top total fails the requirement, and so does one other row, so the
    // answer is never simply "second place".
    const failing = new Set([order[0], order[2]])
    const capacity = scores.map((_, i) =>
      failing.has(i) ? threshold - rint(rng, 1, 4) * 5 : threshold + rint(rng, 1, 8) * 5,
    )
    const rows = shuffle(rng, [0, 1, 2, 3])
    const names = rows.map((_, i) => `${c.noun} ${'ABCD'[i]}`)
    const shownScores = rows.map((i) => scores[i])
    const shownCap = rows.map((i) => capacity[i])
    const shownTotals = rows.map((i) => totals[i])
    // The key is derived from the data: best total among the rows that qualify.
    const qualify = shownCap.map((v, i) => (v >= threshold ? i : -1)).filter((i) => i >= 0)
    const key = qualify.reduce((best, i) => (shownTotals[i] > shownTotals[best] ? i : best), qualify[0])
    const topOverall = shownTotals.indexOf(Math.max(...shownTotals))

    return {
      title: 'Score them, then check the rule',
      prompt:
        `${c.scene} Each is scored out of 10 on ${c.crits.join(', ')}, and the one hard rule is that ${c.req} **${threshold} ${c.unit}**.\n\n` +
        names
          .map(
            (n, i) =>
              `- **${n}** — ${c.crits.map((label, j) => `${label} ${shownScores[i][j]}`).join(', ')}; ${shownCap[i]} ${c.unit}`,
          )
          .join('\n') +
        `\n\nWhich one should the club take?`,
      answer: mcq(rng, names[key], names.filter((_, i) => i !== key)),
      hints: [
        'Apply the hard rule FIRST. Anything that fails it is not a candidate, whatever else it scores.',
        'Then add the three scores for the ones that are left, and take the highest of those.',
        `Worked path: ${names.filter((_, i) => shownCap[i] >= threshold).join(' and ')} meet the rule; of those, **${names[key]}** scores highest at ${shownTotals[key]}.`,
      ],
      explanation:
        `**${names[key]}**. Only ${names.filter((_, i) => shownCap[i] >= threshold).join(' and ')} meet the ${threshold} ${c.unit} rule, and of those ${names[key]} has the best total at ${shownTotals[key]}.\n\n` +
        `The trap is ${names[topOverall]}, which has the highest total on the page at ${shownTotals[topOverall]} — and only ${shownCap[topOverall]} ${c.unit}, which is under the rule. A weighted total is an average of things you care about, and averaging is exactly what hides a deal-breaker: one column can be catastrophic while the other two carry the score. Any requirement that is genuinely a requirement has to be applied as a filter before the scoring starts, not scored alongside everything else.\n\n` +
        `The honest caution the other way: calling something a hard rule when it is really a strong preference throws away good options for nothing. Before filtering, it is worth asking what actually happens if the rule is broken. If the answer is "we would cope", it was a preference and belongs in the scores.`,
    }
  },
)

// ===========================================================================
// st-reversible — the window that shuts before the answer arrives
// ===========================================================================

const WINDOW_CASES: { scene: string; learn: string }[] = [
  {
    scene: 'You are about to buy a second-hand amplifier from an online listing.',
    learn: 'the band tries it at a real rehearsal',
  },
  {
    scene: 'The club is about to order forty printed hoodies in the sizes people gave.',
    learn: 'the sample hoodie arrives to try on',
  },
  {
    scene: 'You are about to sign up for a Saturday course that runs all year.',
    learn: 'you have done the Saturday journey once for real',
  },
  {
    scene: 'The team is about to book a coach for the tournament weekend.',
    learn: 'the fixture list is published',
  },
  {
    scene: 'You are about to buy a phone plan on a long contract.',
    learn: 'you can see a month of your real data use',
  },
  {
    scene: 'The group is about to pay a deposit on the festival flat.',
    learn: 'everyone confirms they can actually come',
  },
]

const revWindow = tpl(
  {
    id: 'dd-rev-window',
    name: 'Does the door shut before you know?',
    skillIds: ['st-reversible'],
    bucket: STRAT,
    difficulty: 3,
    variants: 12,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, WINDOW_CASES)
    const buyDay = rint(rng, 2, 9)
    const window = rint(rng, 5, 20)
    const closes = buyDay + window
    const inTime = seed % 2 === 0
    const gap = rint(rng, 2, 8)
    const learnDay = inTime ? closes - gap : closes + gap
    const late = learnDay - closes
    const key = inTime
      ? `Go ahead — the answer lands ${gap} days before the window shuts`
      : `Move the test earlier — the window shuts ${gap} days too soon`
    const wrong = inTime
      ? [
          'Wait until the answer arrives, then decide about it',
          'Go ahead, and rely on undoing it some other way later on',
          'Go ahead, since a return window this long makes the decision safe whatever happens',
        ]
      : [
          'Go ahead anyway — the window is still better than nothing',
          'Go ahead, and rely on undoing it some other way later on',
          'Go ahead, since a return window of any length makes the decision safe whatever happens',
        ]

    return {
      title: 'Line the dates up',
      prompt:
        `${c.scene}\n\n` +
        `- You would commit on **day ${buyDay}** of the month\n` +
        `- It can be undone free for **${window} days** after that\n` +
        `- The thing you do not know gets settled when **${c.learn}** — that is **day ${learnDay}**`,
      parts: [
        {
          stage: 'Closes',
          prompt: 'On what day of the month does the free-undo window shut?',
          answer: numeric(closes),
          explanation:
            `Day ${buyDay} plus ${window} days is **day ${closes}**. Writing the closing date down as a date is the whole move here — "fourteen days" sits in your head as a comfortable amount of time, and a date can be compared with another date.`,
          hints: [
            'Add the length of the window to the day you commit.',
            `Add the window to the day it started: ${buyDay} + ${window}.`,
            `${buyDay} + ${window} = **${closes}**.`,
          ],
        },
        {
          stage: 'Gap',
          prompt: 'How many days after that does the answer arrive? A negative number means it arrives in time.',
          answer: numeric(late),
          explanation:
            `Day ${learnDay} minus day ${closes} is **${late}**. ${inTime ? `Negative, so the answer beats the door by ${gap} days — the window is doing real work.` : `Positive, so the door shuts ${gap} days before you learn anything — the window looks like protection and covers none of the risk.`}`,
          hints: [
            'Take the closing day off the day you find out.',
            `Count the days past the closing point: ${learnDay} − ${closes}.`,
            `${learnDay} − ${closes} = **${late}**.`,
          ],
        },
        {
          stage: 'Call it',
          prompt: 'So what should happen?',
          answer: mcq(rng, key, wrong),
          explanation:
            `**${key}**.\n\n` +
            `${inTime
              ? `A return window is only worth something if the deciding information arrives while it is open, and here it does — with ${gap} days to spare. Waiting for the answer before committing would also work, and it costs you the ${window} days, which is why "commit, then check inside the window" is often the faster of two safe routes.`
              : `This is the failure that hides behind a generous-sounding policy. A ${window}-day window feels like ${window} days of safety, and it protects you against nothing at all if the only thing that would change your mind is ${gap} days behind it. The fix is not a longer window, which you cannot get; it is to bring the test forward, or to commit later.`}`,
          hints: [
            'The sign of the number you just worked out decides this.',
            'A window that closes before the answer arrives is not protection; it is the appearance of it.',
            `Worked path: window shuts day ${closes}, answer arrives day ${learnDay}.`,
          ],
        },
      ],
      hints: [
        'Turn both the window and the answer into days of the month, then compare them.',
        'Ask what the window actually covers you against, given when you learn anything.',
        `Worked path: shuts on day ${closes}, answer on day ${learnDay}.`,
      ],
      explanation:
        `The window shuts on **day ${closes}** and the answer arrives on **day ${learnDay}**, ${inTime ? `${gap} days inside it` : `${gap} days too late`} — so **${key}**.\n\n` +
        `"Reversible" is not a property a decision has on its own; it is a property of a decision AND a clock. The same purchase with the same return policy is reversible if you can find out in time and irreversible if you cannot, and nobody checks, because a return window is written down where you can see it and the date you find out is not written down anywhere at all.`,
    }
  },
)

// ===========================================================================
// st-secondorder — where the problem goes when a rule moves it
// ===========================================================================

const DISPLACE_CASES: Choice[] = [
  {
    scene: 'The library brings in a booking system for the six study desks, so people stop hovering. Desks are all booked out within a minute of the slots opening each morning.',
    correct: 'Desks sit empty while booked, because a free booking costs nothing to waste',
    wrong: [
      'The desks are used more than they used to be',
      'Students are studying more now that they can plan ahead',
      'The library is busier overall, since booking brings people in who would not have come',
    ],
    tempt: 'The "used more" reading tempts because full bookings look like full desks. Booking measures intention and costs nothing to abandon, so the two numbers come apart the moment the booking is free.',
  },
  {
    scene: 'The school asks everyone to put phones in a box at the classroom door. Phones in lessons drop to almost none. Reports of phones out in the corridors between lessons go up sharply.',
    correct: 'The same use has moved to the five minutes the rule does not cover',
    wrong: [
      'Students are using their phones much less overall',
      'The corridor reports are a coincidence and unrelated to the box',
      'Teachers have simply become more likely to notice and report what they see',
    ],
    tempt: 'The coincidence reading is worth raising, and the timing kills it: the corridor reports started in the same week the box did, and the demand for a phone did not go into the box.',
  },
  {
    scene: 'The club caps the printer at 40 pages per member per term, to stop the paper running out. Individual totals all come in under 40. The paper still runs out.',
    correct: 'People print under other members\' names once they reach the cap',
    wrong: [
      'Members are printing much less than they used to be',
      'The paper is running out because deliveries have been late',
      'The cap has been set too high to have made any real difference to anyone',
    ],
    tempt: 'The late-deliveries reading is a genuine alternative and it is the one to check first, because it is cheap to check. What makes it unlikely here is that the totals-under-cap and the empty tray are exactly the pattern a cap on names rather than on paper produces.',
  },
  {
    scene: 'The canteen introduces a one-way system through the servery to stop the crush. The crush inside disappears. Complaints from the two classrooms by the entrance begin the same week.',
    correct: 'The queue now forms outside those classrooms instead',
    wrong: [
      'Fewer people are using the canteen than before',
      'The classrooms have always complained around this time of year',
      'The system has made serving slower, so people are waiting for longer overall',
    ],
    tempt: 'The slower-serving reading tempts because it would also produce complaints. It predicts complaints from people in the queue, not from the classrooms next to it, and the prompt says where the complaints came from.',
  },
  {
    scene: 'To cut litter, the school removes the bins from the far field so nobody eats there. Litter on the field falls to nearly nothing. Litter in the hedge along the field edge rises.',
    correct: 'The eating did not stop, and the rubbish went to the nearest gap',
    wrong: [
      'People are eating in the canteen instead of outdoors',
      'The hedge litter is blown there from the neighbouring streets',
      'The change has worked, and the hedge is simply where the wind collects things',
    ],
    tempt: 'The wind explanation tempts because hedges genuinely do collect blown litter. It does not explain the timing, and the two changes happened in the same fortnight.',
  },
  {
    scene: 'A club charges a $5 deposit for borrowing equipment, refunded on return. Equipment losses drop from about six items a term to one. Borrowing is unchanged.',
    correct: 'The deposit did what it was for — losses fell and use did not',
    wrong: [
      'People are borrowing under other names to avoid the deposit',
      'The losses have moved to a category nobody is counting yet',
      'Members are keeping items at home rather than returning them, so nothing has really improved',
    ],
    tempt: 'Looking for the hidden backfire is a good habit and it has to be able to come back empty. Borrowing is unchanged, which rules out a barrier to access, and a refundable deposit rewards exactly the behaviour it was meant to reward.',
  },
  {
    scene: 'The team moves training from the far pitch to the one by the gate, because half the squad was arriving late. Lateness drops from nine players to one, and attendance is unchanged.',
    correct: 'The walk was the whole problem, and removing it fixed it',
    wrong: [
      'Players are arriving on time and leaving early instead',
      'The improvement will fade once the novelty of the new pitch wears off',
      'The lateness has been hidden rather than fixed, because nobody is checking the register now',
    ],
    tempt: 'Predicting that it will fade is the safest-sounding wrong answer, because it can never be checked today. A change that named a specific cause and removed it usually just works, and expecting a hidden catch every time is a habit that carries no information.',
  },
  {
    scene: 'To even out the changing rooms, a rota gives each team a fixed slot. Overcrowding at the old peak time disappears, and two teams now regularly finish training fifteen minutes early.',
    correct: 'Teams are cutting training short to reach their slot on time',
    wrong: [
      'The teams have become more efficient with their training time',
      'The rota is unrelated to when the two teams choose to finish',
      'Coaches are running shorter sessions because the pitches are being shared more now',
    ],
    tempt: 'The efficiency reading tempts because finishing early looks like doing the same work faster. Nothing about the rota changed how long a session needs; it changed what finishing late now costs, and the cheapest response is to finish early.',
  },
  {
    scene: 'A year group is given house points for reporting corridor hazards. Reports rise from two a term to sixty. The caretaker says almost none of them are hazards.',
    correct: 'Reports are being written to earn points, not to describe hazards',
    wrong: [
      'Students have become far better at spotting real hazards',
      'The corridors have got substantially more dangerous this term',
      'The caretaker is applying a stricter standard than the students were ever given',
    ],
    tempt: 'The stricter-standard reading is fair and worth checking, and it would predict a rise in borderline reports rather than a thirtyfold rise in reports that are almost all empty. Attaching points to a count rewards the count.',
  },
  {
    scene: 'The bike shed is locked at 3:30 to stop bikes being taken after school. Thefts from the shed fall to zero. Bikes now stand chained to the railings by the gate all afternoon.',
    correct: 'Bikes have moved to the railings, where nothing protects them',
    wrong: [
      'Fewer students are cycling to school than before',
      'Bikes are safer overall, since the shed thefts have stopped',
      'The thefts have moved to the mornings instead, when the shed is still open',
    ],
    tempt: '"Shed thefts are zero, so bikes are safer" is the tempting one because the number really did go to zero. The number counts thefts FROM THE SHED, and the bikes are no longer in the shed — a measure that stops covering the thing it was measuring.',
  },
]

const displaced = tpl(
  {
    id: 'dd-second-displaced',
    name: 'Where did the problem go?',
    skillIds: ['st-secondorder'],
    bucket: STRAT,
    difficulty: 3,
    variants: DISPLACE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, DISPLACE_CASES)
    return {
      title: 'Follow it past the first effect',
      prompt: `${c.scene}\n\nWhat is the most likely explanation?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask who now has a reason to behave differently, and what the cheapest thing for them to do is.',
        'Then check the numbers in the prompt against each story — usually one detail rules out all but one of them.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The habit is one extra question after the rule lands: who changes what they do, and does the goal survive that? Two of the ten situations in this family have no twist in them at all, deliberately. A rule that names a real cause and removes it usually just works, and answering "it will backfire" every time is a reflex, not a prediction.`,
    }
  },
)

// ===========================================================================
// st-sunk — finish this one, or start the other one
// ===========================================================================

const SWITCH_CASES: { scene: string; a: string; b: string; spentOn: string; payoffA: string; payoffB: string }[] = [
  {
    scene: 'The club has one term of Saturdays and can finish one project.',
    a: 'the half-built go-kart',
    b: 'the rebuilt equipment store',
    spentOn: 'parts and steel',
    payoffA: 'the kart would be worth about',
    payoffB: 'the store would save the club about',
  },
  {
    scene: 'The group has six weeks of evenings and can finish one thing.',
    a: 'the half-edited documentary',
    b: 'a short film shot from scratch',
    spentOn: 'filming days and travel',
    payoffA: 'the documentary would bring in about',
    payoffB: 'the short film would bring in about',
  },
  {
    scene: 'The garden group has one season and enough hands for one bed.',
    a: 'the half-dug raised bed',
    b: 'a new bed on the flat ground',
    spentOn: 'timber and soil',
    payoffA: 'the raised bed would produce about',
    payoffB: 'the flat bed would produce about',
  },
  {
    scene: 'The band has one holiday and enough studio money for one recording.',
    a: 'the half-finished album',
    b: 'a fresh three-track session',
    spentOn: 'studio hours already used',
    payoffA: 'the album would earn about',
    payoffB: 'the session would earn about',
  },
  {
    scene: 'The team has one budget left and can complete one job.',
    a: 'the half-resurfaced court',
    b: 'new nets and posts for the field',
    spentOn: 'surfacing and hire',
    payoffA: 'the court is worth about',
    payoffB: 'the field kit is worth about',
  },
]

const sunkSwitch = tpl(
  {
    id: 'dd-sunk-switch',
    name: 'Finish this one, or start the other?',
    skillIds: ['st-sunk'],
    bucket: STRAT,
    difficulty: 4,
    variants: 10,
    minutes: 3.5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SWITCH_CASES)
    const finishWins = seed % 2 === 0
    const costA = rint(rng, 6, 20) * 5
    const costB = rint(rng, 6, 20) * 5
    const gainB = rint(rng, 4, 14) * 5
    const valueB = costB + gainB
    const edge = rint(rng, 3, 12) * 5
    const gainA = finishWins ? gainB + edge : gainB - edge - rint(rng, 1, 3) * 5
    const valueA = costA + gainA
    const spent = rint(rng, 20, 90) * 5
    const key = finishWins
      ? `Finish ${c.a} — ${money(gainA)} ahead against ${money(gainB)}`
      : `Start ${c.b} — ${money(gainB)} ahead against ${money(gainA)}`

    return {
      title: 'Two futures, both costing money',
      prompt:
        `${c.scene}\n\n` +
        `- **Already spent** — ${money(spent)} on ${c.spentOn}, none of it recoverable\n` +
        `- **Finish ${c.a}** — ${money(costA)} more to spend; ${c.payoffA} ${money(valueA)}\n` +
        `- **Start ${c.b}** — ${money(costB)} to spend; ${c.payoffB} ${money(valueB)}\n\n` +
        `There is only room for one of them.`,
      parts: [
        {
          stage: 'Finish it',
          prompt: `What does finishing ${c.a} gain from today? Value minus what is still to spend.`,
          answer: numeric(gainA),
          explanation:
            `${money(valueA)} − ${money(costA)} = **${money(gainA)}**. The ${money(spent)} is not in this sum, because it is spent in both futures — it is the same number whichever project the club picks, so it cannot separate them.`,
          hints: [
            'Only money that has not left yet belongs in this.',
            `${money(valueA)} − ${money(costA)}.`,
            `${money(valueA)} − ${money(costA)} = **${money(gainA)}**.`,
          ],
        },
        {
          stage: 'Start the other',
          prompt: `And starting ${c.b}?`,
          answer: numeric(gainB),
          explanation:
            `${money(valueB)} − ${money(costB)} = **${money(gainB)}**. Notice that this option is not free either — a fresh start costs ${money(costB)}, which is why "abandon it and do something else" is a comparison rather than an escape.`,
          hints: [
            'Same sum for the other project.',
            `${money(valueB)} − ${money(costB)}.`,
            `${money(valueB)} − ${money(costB)} = **${money(gainB)}**.`,
          ],
        },
        {
          stage: 'Pick one',
          prompt: 'Which should the club do?',
          answer: mcq(rng, key, [
            finishWins
              ? `Start ${c.b} — a fresh start avoids throwing more money after the old one`
              : `Finish ${c.a} — stopping now would waste the ${money(spent)} already spent`,
            `Whichever project more of the members enjoy working on`,
            `Finish ${c.a}, because a half-built thing is worth nothing at all`,
          ]),
          explanation:
            `**${key}** — the only comparison that changes with the decision is ${money(gainA)} against ${money(gainB)}.\n\n` +
            `Both of the tempting wrong reasons point at the ${money(spent)}, in opposite directions. "Stopping wastes what we spent" pushes towards finishing; "a fresh start avoids throwing good money after bad" pushes towards abandoning. Neither is a reason, because the ${money(spent)} is identical in both futures — and a rule that told you to abandon whenever something is half-built would be exactly as wrong as one that told you to finish everything you start.`,
          hints: [
            'Two of the four reasons talk about money that has already gone. Cross those out first.',
            'Compare the two forward gains you just worked out, and nothing else.',
            `Worked path: ${money(gainA)} against ${money(gainB)}.`,
          ],
        },
      ],
      hints: [
        'Work out what each option gains from today: what it is worth, minus what it still costs.',
        'Cover the "already spent" line with your hand — the answer should not change when you do.',
        `Worked path: finishing gains ${money(gainA)}, starting fresh gains ${money(gainB)}.`,
      ],
      explanation:
        `Finishing gains ${money(valueA)} − ${money(costA)} = **${money(gainA)}**; starting fresh gains ${money(valueB)} − ${money(costB)} = **${money(gainB)}**. So: **${key}**.\n\n` +
        `This is the harder version of the sunk-cost question, and it is the version that actually turns up. Everybody can nod at "ignore what you have already spent" when the alternative is doing nothing; it gets difficult when the alternative also costs money, takes the same Saturdays, and has its own supporters. The method does not change: price each future from today forward, and let the ${money(spent)} sit outside both sums where it belongs.`,
    }
  },
)

// ===========================================================================
// h-emotion — naming it precisely, holding two readings, deciding between them
// ===========================================================================

const NAME_CASES: Choice[] = [
  {
    scene: 'Kai has talked about the audition all week. This morning he says he probably will not bother going.',
    correct: 'Wanting it badly, and getting out first so it cannot hurt',
    wrong: [
      'Losing interest in something that stopped mattering',
      'Anger at whoever suggested that he should audition in the first place',
      'Ordinary tiredness after a week of thinking hard about one single thing',
    ],
    tempt: 'The lost-interest reading tempts because it is what he actually said, and taking people at their word is usually right. It has to explain the week of talking about it, and it cannot.',
  },
  {
    scene: 'Tam laughs loudly at a joke about their cooking, and then never offers to cook for the group again.',
    correct: 'Stung at the time, and covering it with the laugh',
    wrong: [
      'Enjoying the joke just as much as everyone else did',
      'Boredom with cooking for a group that is difficult to please',
      'Annoyance at being expected to do the cooking every single time',
    ],
    tempt: 'Taking the laugh at face value tempts because it is the only reaction anyone saw. The behaviour afterwards is the second observation, and it is the one that does not fit a person who found it funny.',
  },
  {
    scene: 'Nadia has been offered the place she applied for, and keeps finding reasons it might not work out.',
    correct: 'Pleased, and frightened of counting on it too early',
    wrong: [
      'Regret about applying for something she did not want',
      'Confidence that she can find a better place if she keeps looking',
      'Irritation at the people who keep congratulating her about the offer',
    ],
    tempt: 'The regret reading tempts because listing problems sounds like doubt about the place. Listing what could go wrong is also what people do when something matters and they are protecting themselves from hoping.',
  },
  {
    scene: 'Ellis says "it is fine, honestly" about the changed plan, and then says almost nothing for the rest of the evening.',
    correct: 'Disappointed, and unwilling to be the one making a fuss',
    wrong: [
      'Genuinely fine, and quiet for unrelated reasons',
      'Anger at the person who changed the plan without asking anybody',
      'Relief that the evening turned out to be much shorter than expected',
    ],
    tempt: '"Genuinely fine and quiet for another reason" is the reading to keep alive — it is possible, and it is why the next move is a question rather than a verdict. The two things arriving together is what makes the other reading worth checking.',
  },
  {
    scene: 'Rowan checks the group photo three times to see whether they are in it.',
    correct: 'Wanting to belong, and not yet sure that they do',
    wrong: [
      'Simple curiosity about how the photo came out overall',
      'Vanity about how they look in photographs taken by other people',
      'Concern that somebody has posted a picture without asking permission first',
    ],
    tempt: 'The vanity reading tempts because checking a photo of yourself is what vanity looks like. What is being checked here is whether they are IN it, which is a question about the group rather than about the face.',
  },
  {
    scene: 'Jae apologises four times for a small mistake that nobody minded.',
    correct: 'Anxious about how it landed, more than sorry about the thing',
    wrong: [
      'Politeness, of the kind some people are raised with',
      'Guilt about something bigger that has not been mentioned to anyone',
      'Frustration at having made a mistake in front of people who noticed',
    ],
    tempt: 'The politeness reading tempts because it is generous and often true. Four times is the detail that does not fit: a polite apology happens once, and repetition is usually asking for reassurance rather than offering an apology.',
  },
  {
    scene: 'Bo talks over the person praising their work and changes the subject quickly.',
    correct: 'Pleased and uncomfortable at the same time',
    wrong: [
      'Modesty, and nothing more complicated than that',
      'Disagreement with the praise, which they think is not deserved',
      'Impatience with a conversation they would rather not have had at all',
    ],
    tempt: 'Modesty tempts because that is what we call this behaviour, and naming it stops the enquiry. It describes what was done without saying anything about what it felt like, and the two feelings usually arrive together.',
  },
  {
    scene: 'Sasha keeps offering to help with a job that was finished an hour ago.',
    correct: 'Wanting to be useful, and worried about being surplus',
    wrong: [
      'Not having noticed that the job had already been finished',
      'Wanting the credit for a job that other people did the work on',
      'Boredom, and looking for something to fill the rest of the afternoon',
    ],
    tempt: 'The not-having-noticed reading tempts because it is the simplest and it may be right — which is exactly why the reading is a hypothesis. Repeating the offer after being told is the part that points somewhere else.',
  },
  {
    scene: 'Devi has read the message four times and has not replied.',
    correct: 'Wanting to answer well, and stuck on the fact that it matters',
    wrong: [
      'Not knowing what the message is actually asking',
      'Avoiding the person, and hoping the whole thing goes away by itself',
      'Annoyance at being sent something long at the end of a very busy day',
    ],
    tempt: 'The avoidance reading tempts because silence looks like avoidance from outside. Reading it four times is the opposite of avoiding it, and the two are only distinguishable because the prompt tells you she keeps going back.',
  },
  {
    scene: 'Freddie says he does not care who wins, and then will not talk about the match afterwards.',
    correct: 'Caring about it, and refusing to show it after losing',
    wrong: [
      'Genuine indifference to a result that does not matter',
      'Anger at the referee, which he does not want to say out loud',
      'Boredom with a sport he has been playing for far too many years',
    ],
    tempt: 'Taking "I do not care" literally tempts because it is a direct statement about his own mind, and people are usually the authority on that. Not caring and not wanting to talk about it do not normally travel together.',
  },
]

const emoName = tpl(
  {
    id: 'dd-emo-name',
    name: 'Two feelings, named precisely',
    skillIds: ['h-emotion'],
    bucket: INSIGHT,
    difficulty: 2,
    variants: NAME_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, NAME_CASES)
    return {
      title: 'Name it precisely',
      prompt: `${c.scene}\n\nWhich reading fits best, while staying honest about what is uncertain?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look for TWO things at once. Behaviour that seems to contradict itself usually carries a blend.',
        'Check the reading against every detail in the scene, including the one that seems like decoration.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The caveat that keeps this honest: these are readings of described behaviour, not mind-reading, and a reading is a hypothesis. With a real person the move after a reading is a question — "you seemed a bit off after that, was it the joke or something else?" — and the answer can perfectly well be that you were wrong.`,
    }
  },
)

interface TwoReadCase {
  scene: string
  a: string
  b: string
  /** category 0 = only under reading A, 1 = only under B, 2 = fits both. */
  statements: { text: string; category: number }[]
  note: string
}

const TWO_READ_CASES: TwoReadCase[] = [
  {
    scene: 'Priya has been short with you all week.',
    a: 'annoyed with you',
    b: 'worried about the exams',
    statements: [
      { text: 'She answers you in one word and everyone else normally', category: 0 },
      { text: 'She moved seats away from you and from nobody else', category: 0 },
      { text: 'She is just as short with the people she sits with', category: 1 },
      { text: 'She was fine until the day the exam timetable went up', category: 1 },
      { text: 'She has stopped staying behind after the lesson', category: 2 },
      { text: 'She has looked tired every morning this week', category: 2 },
    ],
    note: 'The two facts that separate the readings both compare you with somebody else. That is the general shape of a useful observation here: it has to come out differently depending on which reading is true.',
  },
  {
    scene: 'Sam has stopped replying in the group chat.',
    a: 'fed up with this group',
    b: 'buried in something else',
    statements: [
      { text: 'He still replies to everyone except this group', category: 0 },
      { text: 'He left this group and stayed in the other one', category: 0 },
      { text: 'He has replied to nobody in any chat for a week', category: 1 },
      { text: 'His messages to the football chat stopped the same day', category: 1 },
      { text: 'He has been at school as normal all week', category: 2 },
      { text: 'He has not explained anything to anybody', category: 2 },
    ],
    note: 'Notice how little the "fits both" facts do. He has been at school and he has said nothing — those are true in every version of this, so however strongly they feel like evidence, they are not.',
  },
  {
    scene: 'A teammate has gone quiet at training.',
    a: 'unhappy with the coach',
    b: 'carrying an injury',
    statements: [
      { text: 'He is talkative until the coach walks over', category: 0 },
      { text: 'He has asked twice about moving to another session', category: 0 },
      { text: 'He is quiet in the changing room before anyone speaks', category: 1 },
      { text: 'He has stopped doing the sprint drills and nothing else', category: 1 },
      { text: 'He has come to every session this term', category: 2 },
      { text: 'He has not said anything about it to anyone', category: 2 },
    ],
    note: 'The sprint drills are the sharpest fact on the list: an injury explains dropping one specific thing, and being unhappy with a coach does not pick out sprints in particular.',
  },
  {
    scene: 'Your sister has been in her room every evening.',
    a: 'avoiding the family',
    b: 'behind on work',
    statements: [
      { text: 'She comes down only once you have all gone out', category: 0 },
      { text: 'She eats after everyone else has finished', category: 0 },
      { text: 'The light is on in there until two in the morning', category: 1 },
      { text: 'She has cancelled on her friends this week as well', category: 1 },
      { text: 'She has been quiet at the table', category: 2 },
      { text: 'She has not said why', category: 2 },
    ],
    note: 'Cancelling on friends is the fact that does the most work, because it is the one that separates "avoiding US" from "avoiding everything". Withdrawal that is general is not a message about you.',
  },
  {
    scene: 'A friend did not save you a seat.',
    a: 'cooling off the friendship',
    b: 'the row filled before she arrived',
    statements: [
      { text: 'She has not sat with you for three weeks now', category: 0 },
      { text: 'She sat with the group she has been with all term', category: 0 },
      { text: 'The row was full before the bell even went', category: 1 },
      { text: 'She saved nobody a seat, not only you', category: 1 },
      { text: 'She was already there when you came in', category: 2 },
      { text: 'She said nothing about it afterwards', category: 2 },
    ],
    note: 'Both "fits both" facts are the ones that hurt most in the moment, and neither carries information. That mismatch — the sharpest feeling attached to the least diagnostic fact — is worth knowing about yourself.',
  },
  {
    scene: 'A club member has stopped volunteering for jobs.',
    a: 'fed up with how jobs are handed out',
    b: 'short of time this term',
    statements: [
      { text: 'She stands back when jobs are handed out, and stays', category: 0 },
      { text: 'She said the same three people always get asked', category: 0 },
      { text: 'She has dropped two other commitments as well', category: 1 },
      { text: 'Her shifts moved to three evenings a week', category: 1 },
      { text: 'She has not missed a single session', category: 2 },
      { text: 'She has said nothing to the committee', category: 2 },
    ],
    note: 'Standing back and staying is a strange combination, and strange combinations are where the information is: someone short of time leaves, and someone unhappy with a process often stays and withdraws from part of it.',
  },
  {
    scene: 'A parent has said no to the last three requests.',
    a: 'tightening the rules',
    b: 'money is tight this term',
    statements: [
      { text: 'They have started asking who else will be going', category: 0 },
      { text: 'They said the rules were changing from now on', category: 0 },
      { text: 'All three of the requests cost money', category: 1 },
      { text: 'They cancelled their own weekend away as well', category: 1 },
      { text: 'They answered quickly on each occasion', category: 2 },
      { text: 'They did not explain the reason', category: 2 },
    ],
    note: 'A fast no feels like a pre-made no, and it appears in the "fits both" column because it is exactly what a known constraint also produces. Speed measures how settled the answer already was, not why.',
  },
  {
    scene: 'Someone in the group has stopped putting ideas forward.',
    a: 'her idea was laughed at',
    b: 'she has less time to prepare',
    statements: [
      { text: 'She stopped the week her idea was laughed at', category: 0 },
      { text: 'She now sends her ideas to one person privately', category: 0 },
      { text: 'She arrives at meetings straight from work now', category: 1 },
      { text: 'She has stopped reading the agenda beforehand', category: 1 },
      { text: 'She still comes to every meeting', category: 2 },
      { text: 'She has said nothing about why', category: 2 },
    ],
    note: 'Sending ideas privately is the giveaway, and it is the sort of detail people notice and then discard. It says the ideas still exist and the room is what changed.',
  },
]

const emoTwoReadings = tpl(
  {
    id: 'dd-emo-fits',
    name: 'Which facts actually separate the two readings?',
    skillIds: ['h-emotion'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: TWO_READ_CASES.length,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, TWO_READ_CASES)
    return {
      title: 'Hold both readings at once',
      prompt:
        `${c.scene}\n\nTwo readings are on the table: she is **${c.a}**, or she is **${c.b}**.\n\n` +
        `Sort each observation. Does it only make sense under one reading, or would it look exactly the same either way?`,
      answer: classify(rng, [`Only if ${c.a}`, `Only if ${c.b}`, 'Either way'], c.statements),
      hints: [
        'Take each observation and imagine both worlds. Ask whether you would still expect to see it in each of them.',
        'If you would see it either way, it cannot help you choose — however strongly it feels like evidence.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation:
        `${c.statements
          .map((s) => `**${[`Only if ${c.a}`, `Only if ${c.b}`, 'Either way'][s.category]}**: ${s.text}`)
          .join('. ')}.\n\n${c.note}\n\n` +
        `The point of the third column is that it is usually the biggest one in real life, and its contents are what people argue from. Holding two readings honestly means noticing how much of what you have noticed does not choose between them — and then going and finding one thing that would.`,
    }
  },
)

const DECIDER_CASES: (Choice & { a: string; b: string })[] = [
  {
    scene: 'Ola has gone quiet since the team list went up.',
    a: 'disappointed at not being picked',
    b: 'worried about the exam that week',
    correct: 'Whether she went quiet before the list or after it',
    wrong: [
      'How close she came to being picked',
      'Whether she has ever been quiet like this at any point before',
      'How badly she says she wanted the place when you asked her about it',
    ],
    tempt: 'How close she came tempts because it is about the thing you think is the cause, and near-misses feel like they should sting more. It is the same fact under both readings, so learning it moves nothing.',
  },
  {
    scene: 'Your brother keeps leaving the room whenever the trip is mentioned.',
    a: 'he does not want to come',
    b: 'he cannot afford it',
    correct: 'Whether he leaves when the cost comes up or when the dates do',
    wrong: [
      'Whether he came on the trip last year',
      'How many other people from his year have already signed up for it',
      'Whether he has ever said anything at all about wanting to go on it',
    ],
    tempt: 'Last year tempts because a history feels like the strongest evidence there is. It was a different price and a different year, and it fits either reading about this one.',
  },
  {
    scene: 'A friend has started replying to you in single words.',
    a: 'something you did',
    b: 'something at home',
    correct: 'Whether the short replies go to everyone or only to you',
    wrong: [
      'How long the replies have been getting shorter',
      'Whether you can remember doing anything',
      'Whether she has been the same in person as she is over messages',
    ],
    tempt: 'Searching your memory for what you did tempts most of all, because it feels like taking responsibility. It also assumes the answer before checking, and you can generate a candidate for any week you like.',
  },
  {
    scene: 'A club member has been arriving late every week this term.',
    a: 'they have lost interest',
    b: 'the bus times changed',
    correct: 'Whether the lateness started the week the timetable changed',
    wrong: [
      'How late they usually are on an ordinary week during the term',
      'Whether they seem to be enjoying it once they actually arrive',
      'Whether anyone else in the club has started turning up late as well',
    ],
    tempt: 'Whether anyone else is late is a good instinct and nearly the right question — it just answers a different one, since only some members use that bus. The date the lateness started lines up with a known event.',
  },
  {
    scene: 'Your dad has been sharp with everyone this week.',
    a: 'something at work',
    b: 'something you did',
    correct: 'Whether the sharpness started before or after Saturday',
    wrong: [
      'Whether he is sharper with you than with your sister',
      'How long it has been since he was in a mood anything like this one',
      'Whether he has said anything about work',
    ],
    tempt: 'Comparing how he treats you and your sister looks decisive and is weaker than it seems: the two of you do different things, ask for different things, and were in the house at different times.',
  },
  {
    scene: 'A teammate has stopped celebrating goals with the rest of the team.',
    a: 'unhappy in the team',
    b: 'embarrassed about his own run of misses',
    correct: 'Whether it started before or after his scoring dried up',
    wrong: [
      'How many goals he has actually missed',
      'Whether he still turns up to training on the same nights as before',
      'Whether he celebrates when the goal is scored by his closest friend',
    ],
    tempt: 'Counting the misses tempts because it is the only number available, and numbers feel like evidence. The count is the same fact under both readings; the ORDER of events is the thing that differs.',
  },
  {
    scene: 'A friend changes the subject whenever you mention exam results.',
    a: 'hers went badly',
    b: 'she thinks yours did',
    correct: 'Whether she changes it when other people mention results',
    wrong: [
      'What she said about the exams before any of you had sat them',
      'Whether she has told anybody else in your year what her results were',
      'How quickly she moves the conversation on when the subject does come up',
    ],
    tempt: 'How fast she changes the subject tempts because speed feels like a signal. It would be fast under both readings, and a measurement that comes out the same either way is not a measurement of anything.',
  },
  {
    scene: 'Someone has stopped sitting with your group at lunch.',
    a: 'they fell out with somebody here',
    b: 'they joined something that meets at lunchtime',
    correct: 'Whether they are somewhere else at that exact time daily',
    wrong: [
      'Whether they still speak to you in lessons',
      'Whether anyone remembers a disagreement',
      'How long they had been sitting with the group before they stopped',
    ],
    tempt: 'Whether they still speak to you in lessons is a genuinely useful signal and it is the second-best question here. It is weaker because friendliness can survive a fallout, and being physically elsewhere at 12:30 every day cannot.',
  },
  {
    scene: 'A group member is doing far more than their share of the project.',
    a: 'they enjoy the work',
    b: 'they do not trust the rest of you',
    correct: 'Whether they redo work that others have already finished',
    wrong: [
      'How many hours they have put in so far',
      'Whether they took on the extra work without anybody asking them to',
      'Whether they have complained to anyone about how much they are doing',
    ],
    tempt: 'Whether they volunteered tempts because volunteering sounds like enthusiasm. Both readings produce volunteering — one because the work is enjoyable, one because handing it over feels risky — so the fact does not choose.',
  },
  {
    scene: 'Your friend has been unusually generous all week.',
    a: 'they are in a good mood',
    b: 'they feel bad about something',
    correct: 'Whether it started the day after the argument',
    wrong: [
      'How generous they have been, compared with usual',
      'Whether they have been generous with other people this week as well',
      'Whether anything good has happened to them that you happen to know about',
    ],
    tempt: 'Whether something good has happened tempts because it would explain a good mood. It would also sit comfortably beside guilt, so it supports one reading without ruling out the other — and timing does both.',
  },
]

const emoDecider = tpl(
  {
    id: 'dd-emo-decider',
    name: 'The one fact that would decide it',
    skillIds: ['h-emotion'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: DECIDER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, DECIDER_CASES)
    return {
      title: 'Choose the question worth asking',
      prompt:
        `${c.scene}\n\nTwo readings fit: **${c.a}**, or **${c.b}**.\n\n` +
        `You can find out exactly one more thing. Which would actually separate them?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A useful fact is one whose two possible answers point at different readings.',
        'Test each option twice: what would you expect under the first reading, and under the second? If the answer is the same, it is decoration.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Timing and comparison do most of the work in questions like this. When did it start, and does it happen with other people or in other places? Those two questions separate more readings than any amount of thinking about what somebody must have meant — and both of them can usually be answered without asking anyone to explain themselves.`,
    }
  },
)

interface SayCase {
  scene: string
  /** 0 = a feeling, 1 = a judgement of them, 2 = a demand. */
  statements: { text: string; category: number }[]
  note: string
}

const SAY_CASES: SayCase[] = [
  {
    scene: 'A friend cancelled on you an hour before, for the third time.',
    statements: [
      { text: 'I felt let down when it got called off', category: 0 },
      { text: 'I had been looking forward to it all week', category: 0 },
      { text: 'You are completely unreliable about everything', category: 1 },
      { text: 'You never think about anybody except yourself', category: 1 },
      { text: 'Tell me a day in advance next time', category: 2 },
      { text: 'Do not do this to me again', category: 2 },
    ],
    note: 'The two feelings are the only lines the other person cannot argue with, because they are reports about you. The judgements are the two they will argue with hardest, and the argument will be about their character rather than about Saturday.',
  },
  {
    scene: 'Your brother borrowed your headphones and returned them broken.',
    statements: [
      { text: 'I was upset when I saw the cable', category: 0 },
      { text: 'I feel like my things are not safe here', category: 0 },
      { text: 'You are careless with everything you touch', category: 1 },
      { text: 'You have never respected anyone else\'s stuff', category: 1 },
      { text: 'Ask me before you take them next time', category: 2 },
      { text: 'You need to pay for a replacement pair', category: 2 },
    ],
    note: 'Notice that the two demands here are entirely reasonable. Sorting a sentence as a demand is not sorting it as a bad thing; it is noticing that it asks for something, and that asking works better once the feeling has been said and heard.',
  },
  {
    scene: 'A group member has not sent their section, two days before the deadline.',
    statements: [
      { text: 'I am worried we will not finish in time', category: 0 },
      { text: 'I felt stuck waiting without hearing anything', category: 0 },
      { text: 'You always leave everything to everybody else', category: 1 },
      { text: 'You clearly do not care how this goes for us', category: 1 },
      { text: 'Send what you have by tonight', category: 2 },
      { text: 'Tell us today if you cannot do it', category: 2 },
    ],
    note: 'The judgements are the ones that feel most satisfying to send and are least likely to produce the section. They also hand the other person a defence to mount, which is time neither of you has.',
  },
  {
    scene: 'Someone repeated something you had told them privately.',
    statements: [
      { text: 'I felt exposed when it came back to me', category: 0 },
      { text: 'I have been uneasy about talking since', category: 0 },
      { text: 'You cannot be trusted with anything at all', category: 1 },
      { text: 'You enjoy having something on other people', category: 1 },
      { text: 'Do not pass on what I tell you', category: 2 },
      { text: 'Tell me who else you told about it', category: 2 },
    ],
    note: '"You enjoy having something on people" is a claim about their motives, which is the part you cannot see and they will deny. The feeling and the request between them cover everything you actually need said.',
  },
  {
    scene: 'A teammate keeps making jokes at your expense in front of the squad.',
    statements: [
      { text: 'I do not enjoy being the joke there', category: 0 },
      { text: 'I have been dreading Thursday sessions', category: 0 },
      { text: 'You are a bully and everyone can see it', category: 1 },
      { text: 'You need other people to look small', category: 1 },
      { text: 'Stop making jokes about me in front of them', category: 2 },
      { text: 'Say something to them about it yourself', category: 2 },
    ],
    note: '"Everyone can see it" recruits an audience into the sentence, which turns a boundary into a confrontation. The plain request in the demand column is the one that has a chance of changing Thursday.',
  },
  {
    scene: 'A parent read your messages without asking.',
    statements: [
      { text: 'I felt watched, and it made me uneasy', category: 0 },
      { text: 'I have stopped writing things down since', category: 0 },
      { text: 'You do not trust me about anything', category: 1 },
      { text: 'You have never respected my privacy at all', category: 1 },
      { text: 'Ask me before you look at my phone', category: 2 },
      { text: 'Tell me what you were worried about', category: 2 },
    ],
    note: 'The second demand is the interesting one: asking what they were worried about is a request, and it is also the sentence most likely to turn this into a conversation rather than a standoff.',
  },
  {
    scene: 'A friend has been leaving you out of plans they make in the chat.',
    statements: [
      { text: 'I felt left out when I saw the photos', category: 0 },
      { text: 'It has been on my mind all weekend', category: 0 },
      { text: 'You have been deliberately excluding me', category: 1 },
      { text: 'You would rather be with them than me', category: 1 },
      { text: 'Ask me next time you are making plans', category: 2 },
      { text: 'Tell me if something has changed', category: 2 },
    ],
    note: '"Deliberately" is doing all the work in that judgement, and it is the one word you have no evidence for. Dropping it turns an accusation into something you can actually say and they can actually answer.',
  },
  {
    scene: 'A club member volunteered you for a job without asking you first.',
    statements: [
      { text: 'I was annoyed to hear it from somebody else', category: 0 },
      { text: 'I feel awkward about pulling out now', category: 0 },
      { text: 'You take other people for granted constantly', category: 1 },
      { text: 'You never think about what anyone else has on', category: 1 },
      { text: 'Ask me first before putting my name down', category: 2 },
      { text: 'Take my name off the list for this one', category: 2 },
    ],
    note: 'Both demands here are short and specific, which is what makes them usable. A demand that cannot be complied with by a particular action on a particular day is really a judgement wearing an instruction.',
  },
]

const emoThreeWays = tpl(
  {
    id: 'dd-emo-three-ways',
    name: 'A feeling, a verdict, or an ask?',
    skillIds: ['h-emotion', 'h-boundary'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: SAY_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, SAY_CASES)
    return {
      title: 'Sort what you could say',
      prompt:
        `${c.scene}\n\nSix things you could say. Sort each one: is it a **feeling** you are reporting, a **judgement** about the kind of person they are, or a **request** for something to change?`,
      answer: classify(rng, ['A feeling', 'A judgement of them', 'A request'], c.statements),
      hints: [
        'A feeling is a report about you, and only you can be wrong about it. A judgement is a claim about them.',
        'A request names a specific thing somebody could do. Watch for the word "always" or "never" — those two words almost always mark a judgement.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation:
        `${c.statements
          .map((s) => `**${['Feeling', 'Judgement', 'Request'][s.category]}**: ${s.text}`)
          .join('. ')}.\n\n${c.note}\n\n` +
        `Why the sorting is worth doing: feelings and requests can both be answered, and judgements can only be disputed. Saying "I felt left out, so ask me next time" gives the other person something to do; saying "you always exclude me" gives them something to deny, and the next twenty minutes go on whether "always" is fair. All three kinds of sentence are legitimate — it is just that the middle column reliably costs you the conversation you wanted to have.`,
    }
  },
)

// ===========================================================================
// h-influence — recognition and refusal, never the other direction
// ===========================================================================

interface TacticCase {
  msg: string
  tactics: string[]
  fine: string[]
  note: string
}

const TACTIC_CASES: TacticCase[] = [
  {
    msg: '"Only 3 left at this price! Offer ends in 07:32. 41 people are looking at this right now. Add the cover for just $2 more?"',
    tactics: [
      'A stock count you have no way of checking',
      'A countdown clock attached to the price',
      'A crowd of viewers nobody can verify',
      'An extra slipped in at the moment of paying',
    ],
    fine: ['The price of the extra is stated plainly', 'The message says what is being sold'],
    note: 'Four levers in one short message, and each is small on its own. Stacking is the point: one urgent line is enthusiasm, four is choreography.',
  },
  {
    msg: '"Please get the trip form in by Friday — the coach company needs numbers then. Say if you need longer. Everyone else has handed theirs in."',
    tactics: ['A nudge that everybody else has already done it'],
    fine: [
      'The reason for the deadline is given',
      'You are told you can ask for more time',
      'The date is set by the coach company',
      'It is clear who the message is from',
    ],
    note: 'One line of social pressure inside a message that is otherwise straight. That is the ordinary case, and treating the whole message as manipulation would be as wrong as missing the line.',
  },
  {
    msg: '"I lent you my charger all last term, so it is a bit much to say no now. I need it back tonight or I am stuck. Do not tell the others I asked."',
    tactics: [
      'Past help turned into a debt you now owe',
      'A deadline that leaves no time to think',
      'A request to keep the ask from other people',
    ],
    fine: ['What is being asked for is stated clearly', 'The person asking is somebody you know'],
    note: 'Secrecy is the loudest of the three. A request that is reasonable in daylight does not need the others kept out of it, and "do not tell anyone" is worth treating as the signal rather than the footnote.',
  },
  {
    msg: '"Cancel any time! (Cancellations by phone only, weekdays 9-11am, after a short retention call. Your saved playlists are deleted on cancellation.)"',
    tactics: [
      'An exit built to be far harder than the entry',
      'A punishment for leaving, held over you',
    ],
    fine: [
      'The cancellation hours are disclosed somewhere',
      'The consequence of cancelling is stated',
      'You are told cancelling is possible at all',
    ],
    note: 'Everything here is disclosed, and it is still a designed trap: the friction is placed exactly where leaving happens, and losing your playlists is a hostage rather than a technical necessity.',
  },
  {
    msg: '"Everyone from the year is doing the challenge. Sign-ups close at midnight. It is only $5. You do not want to be the one who sat it out."',
    tactics: [
      'A claim that everyone is already in',
      'A cut-off that stops you thinking it over',
      'A small price used to wave away the decision',
      'The suggestion that refusing makes you the odd one',
    ],
    fine: ['The cost is stated up front', 'The sign-up date is given clearly'],
    note: '"It is only $5" is the one people miss, because it sounds like reassurance. Shrinking the cost is a way of arguing that the decision does not deserve any thought, which is a claim about the decision rather than about the price.',
  },
  {
    msg: '"We would love you in the club. Thursdays, 4 to 5:30, in the science block. Come and try one, and if it is not for you, no problem at all."',
    tactics: ['A warm opening line meant to make you feel picked out'],
    fine: [
      'The time and place are both stated',
      'You are invited to try one and leave',
      'No deadline is attached to the decision',
      'Nothing is asked for in advance',
    ],
    note: 'The warm opening is barely a tactic and it is worth naming anyway, because that is what a flattering first line does. The rest of the message is what an honest ask looks like: real information, an easy exit, no clock.',
  },
  {
    msg: '"Free prize draw! Just enter your name, school, year group, phone number and your parents\' email to be in with a chance. Winner announced this week."',
    tactics: [
      'A prize used to buy information about you',
      'A list of details far beyond what a draw needs',
      'A close-by date that discourages checking it out',
    ],
    fine: ['The prize is described in the message', 'It says when the result will be announced'],
    note: 'The test is whether the information asked for is needed for the thing offered. A draw needs a way to contact one winner; it does not need a school, a year group and a parent\'s address, and that gap is what the prize is paying for.',
  },
  {
    msg: '"The hall is booked for the 14th, so the programme has to go to the printer by the 7th. Also — only two other groups have this slot, so it is quite exclusive."',
    tactics: ['A claim of exclusivity with nothing behind it'],
    fine: [
      'The print deadline follows from the booking',
      'The date of the event is stated',
      'The reason for the earlier date is explained',
      'Nothing is being asked for in secret',
    ],
    note: 'The 7th is a real deadline: it is set by the printer and the hall, not by the sender, and it survives being questioned. The exclusivity line is decoration doing a job, and separating the two is most of this skill.',
  },
]

const infCount = tpl(
  {
    id: 'dd-inf-count',
    name: 'Select every pressure tactic present',
    skillIds: ['h-influence'],
    bucket: INSIGHT,
    difficulty: 4,
    variants: TACTIC_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, TACTIC_CASES)
    return {
      title: 'Tactic census',
      prompt:
        `A message reads:\n\n> ${c.msg}\n\n` +
        `Select every line below that is doing **pressure** work. Some of them are just the message being clear with you, and the number of real tactics varies from one message to the next.`,
      answer: multi(rng, c.tactics, c.fine),
      hints: [
        'Ask of each one: what does this do to my ability to think, check, or say no?',
        'Being clear about a price, a date or a reason is not pressure. Manufacturing a clock, a crowd or a debt is.',
        `Worked path: ${c.tactics.join('; ')}.`,
      ],
      explanation:
        `The pressure lines: ${c.tactics.join('; ')}.\n\n${c.note}\n\n` +
        `Counting rather than judging the message as a whole is deliberate. A message can carry one tactic and be broadly honest, and treating every direct request as manipulation is its own failure — a detector that fires on everything tells you nothing, and it costs you the ordinary asks that ordinary people make. The defence is always the same and never involves out-arguing anyone: name what is being done, then answer on your own clock.`,
    }
  },
)

interface SortTacticCase {
  scene: string
  /** 0 = time pressure, 1 = social pressure, 2 = a debt or a feeling used as leverage. */
  statements: { text: string; category: number }[]
  note: string
}

const TACTIC_SORT: SortTacticCase[] = [
  {
    scene: 'Lines pulled out of a message trying to get you to join a group order.',
    statements: [
      { text: '"Closing the order in twenty minutes"', category: 0 },
      { text: '"Last chance, I am sending it now"', category: 0 },
      { text: '"Everyone else in the year is in"', category: 1 },
      { text: '"You will be the only one without one"', category: 1 },
      { text: '"After I covered for you last week"', category: 2 },
      { text: '"I would be really hurt if you said no"', category: 2 },
    ],
    note: 'The three columns attack three different things: the time you would use to think, your sense of where everyone else stands, and your wish not to be unfair or unkind.',
  },
  {
    scene: 'Lines from a message pushing you to lend something out.',
    statements: [
      { text: '"I need to know in the next five minutes"', category: 0 },
      { text: '"There is no time to check with anyone"', category: 0 },
      { text: '"Nobody else would even hesitate here"', category: 1 },
      { text: '"Ask anyone, this is completely normal"', category: 1 },
      { text: '"I thought we were closer than that"', category: 2 },
      { text: '"I have never once said no to you"', category: 2 },
    ],
    note: '"There is no time to check with anyone" is worth flagging in both columns and belongs in the first: its function is to stop the clock, and cutting you off from other people is how it does it.',
  },
  {
    scene: 'Lines from a page selling a study course.',
    statements: [
      { text: '"Price goes up at midnight tonight"', category: 0 },
      { text: '"Only today at this level of discount"', category: 0 },
      { text: '"Over 9,000 students already enrolled"', category: 1 },
      { text: '"Recommended by top students everywhere"', category: 1 },
      { text: '"Do not let your family down again"', category: 2 },
      { text: '"You owe it to yourself after last year"', category: 2 },
    ],
    note: 'The last two are the ones that feel least like sales copy, because they are phrased as being on your side. A sentence that tells you what you owe somebody is doing leverage work whoever it names.',
  },
  {
    scene: 'Lines from a message trying to get you to a party you had said no to.',
    statements: [
      { text: '"Decide now, we are leaving in ten"', category: 0 },
      { text: '"I need an answer before I get on the bus"', category: 0 },
      { text: '"Literally everyone is going to be there"', category: 1 },
      { text: '"You are the only one still saying no"', category: 1 },
      { text: '"I came to yours when I did not want to"', category: 2 },
      { text: '"It would mean a lot to me, after everything"', category: 2 },
    ],
    note: '"It would mean a lot to me" is a completely legitimate sentence between friends. What puts it in this column is the "after everything" — the moment a favour is invoked, a request has become an invoice.',
  },
  {
    scene: 'Lines from a message pressing you to sign up for a subscription.',
    statements: [
      { text: '"Offer expires when this page closes"', category: 0 },
      { text: '"Two minutes left to keep this price"', category: 0 },
      { text: '"Most people choose the middle plan"', category: 1 },
      { text: '"Join the thousands who switched already"', category: 1 },
      { text: '"We gave you a free month, remember"', category: 2 },
      { text: '"Leaving now would waste all your progress"', category: 2 },
    ],
    note: '"Most people choose the middle plan" is the gentlest line on the page and still social pressure — it is put there to make one option feel like the safe default, which is a decision made for you.',
  },
  {
    scene: 'Lines from a message asking you to hand over an account password.',
    statements: [
      { text: '"I need it right now, before the game starts"', category: 0 },
      { text: '"There is no time to ask your parents"', category: 0 },
      { text: '"Everyone shares logins, it is normal"', category: 1 },
      { text: '"None of my other friends make this a thing"', category: 1 },
      { text: '"I trusted you with mine, remember"', category: 2 },
      { text: '"If you trusted me you would not think twice"', category: 2 },
    ],
    note: 'Sorting is useful and the answer here does not depend on it: a password is not shared, and any message combining urgency with cutting out the adults has already told you what it is. Name it, refuse it, and tell somebody.',
  },
  {
    scene: 'Lines from a message trying to get a group to change its vote.',
    statements: [
      { text: '"We need to settle it before anyone else arrives"', category: 0 },
      { text: '"If we do not decide tonight the chance is gone"', category: 0 },
      { text: '"The three of us already agree about it"', category: 1 },
      { text: '"Nobody sensible thinks the other way"', category: 1 },
      { text: '"I backed you when you wanted the other room"', category: 2 },
      { text: '"You would be letting the group down here"', category: 2 },
    ],
    note: 'Deciding "before anyone else arrives" is the sharpest line in the set: it is time pressure whose purpose is to shrink the room, which is why it belongs in the first column and not the second.',
  },
  {
    scene: 'Lines from a shop assistant pressing for an extended warranty.',
    statements: [
      { text: '"I can only do this price while you are stood here"', category: 0 },
      { text: '"The system closes the offer at the end of today"', category: 0 },
      { text: '"Nearly everyone takes it with this model"', category: 1 },
      { text: '"The people who skip it always regret it"', category: 1 },
      { text: '"I have spent half an hour with you on this"', category: 2 },
      { text: '"I would feel bad letting you leave without it"', category: 2 },
    ],
    note: '"I have spent half an hour with you" converts their working time into your obligation, and it works because it is true. Their half hour was their choice, and it was made before you decided anything.',
  },
]

const infSort = tpl(
  {
    id: 'dd-inf-sort',
    name: 'Sort the levers',
    skillIds: ['h-influence'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: TACTIC_SORT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, TACTIC_SORT)
    return {
      title: 'Three kinds of push',
      prompt:
        `${c.scene}\n\nSort each line by what it is leaning on: your **time**, your sense of what **everyone else** is doing, or a **debt or feeling** it is turning into an obligation.`,
      answer: classify(rng, ['Time pressure', 'Social pressure', 'Debt or feeling'], c.statements),
      hints: [
        'Ask what each line is trying to take away: your thinking time, your independent judgement, or your right to refuse without guilt.',
        'Time pressure often hides as helpfulness ("I just need to know quickly"), and debt often hides as friendship.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation:
        `${c.statements
          .map((s) => `**${['Time', 'Social', 'Debt'][s.category]}**: ${s.text}`)
          .join('. ')}.\n\n${c.note}\n\n` +
        `Naming which lever is being pulled is most of the defence, because each one has a matching answer and none of the answers is an argument. Time pressure is answered by taking the time anyway. Social pressure is answered by noticing you cannot check the claim. A debt is answered by separating the two things: "I am glad we help each other, and I still cannot do this one" — both halves true, neither one a fight.`,
    }
  },
)

const DARK_CASES: Choice[] = [
  {
    scene: 'The "yes, sign me up" button is large and coloured. The "no thanks" is grey text, smaller, below the fold.',
    correct: 'A dark pattern — the two answers are not offered equally',
    wrong: [
      'Ordinary design, since buttons have to look like something',
      'A mistake by whoever built the page rather than a deliberate choice',
      'Good practice, because it makes the option most people want easy to find',
    ],
    tempt: '"It makes the popular option easy to find" tempts because that is a real design principle. It stops being that when the other option is made hard to find, which is a different decision from making one easy.',
  },
  {
    scene: 'Joining takes two taps. Cancelling requires a phone call on weekday mornings, after a retention conversation.',
    correct: 'A dark pattern — easy to enter and built to be hard to leave',
    wrong: [
      'Reasonable, since cancelling is a bigger decision',
      'A security measure to prove who you are',
      'An old system that has not been brought up to date with the sign-up page',
    ],
    tempt: 'The security reading tempts because identity checks are real. The giveaway is the asymmetry: joining also creates an account and needed no phone call, so the friction is not about proving who you are.',
  },
  {
    scene: 'The price is $18 throughout. On the final screen a $9 service charge appears and the total reads $27.',
    correct: 'A dark pattern — the real price arrives after you have committed',
    wrong: [
      'Normal, since fees have to be shown somewhere',
      'A legal requirement, because the charge has to be listed separately',
      'Fair enough, since you can still stop at that point without paying anything',
    ],
    tempt: '"You can still stop" tempts because it is true and it feels like it settles the question. By that screen you have spent ten minutes and made a decision, and the design is built on the knowledge that almost nobody restarts.',
  },
  {
    scene: 'The order page has a pre-ticked box adding a monthly magazine, below the delivery details.',
    correct: 'A dark pattern — it takes a decision by making silence a yes',
    wrong: [
      'Convenient, since most buyers want the magazine',
      'Acceptable, since the box can be unticked',
      'A neutral default, and defaults have to be set to something one way or the other',
    ],
    tempt: '"Defaults have to be something" tempts because it is literally true. The honest default for a thing that costs money every month is off, and choosing on is a choice about who benefits from people not reading.',
  },
  {
    scene: 'A countdown says your basket expires in ten minutes. Refreshing the page starts it at ten minutes again.',
    correct: 'A dark pattern — and the reset is the proof that the clock is fake',
    wrong: [
      'A technical glitch in how the timer is coded',
      'Reasonable, since baskets do have to expire at some point for stock reasons',
      'Fine, because it warns you rather than simply throwing the basket away silently',
    ],
    tempt: 'The glitch reading tempts because timers really do break. A real hold on stock would survive a refresh — that is what holding stock means — so the reset is not a bug in the countdown, it is what the countdown is.',
  },
  // Deliberately at index 5: the content audit checks seeds 0, 1, 2, 3, 5 and 8
  // when asking whether an Insight family can ever answer "nothing is wrong".
  {
    scene: 'The app asks for your contacts once, says in a sentence what it uses them for, and works normally if you say no.',
    correct: 'Nothing here is a dark pattern — the ask is explained and no works',
    wrong: [
      'A dark pattern, because an app has no business asking for your contacts',
      'A dark pattern, because asking at all puts pressure on people to agree',
      'A dark pattern, since the app clearly wants the contacts for its own purposes',
    ],
    tempt: '"It wants them for its own purposes" tempts because it is true and it is not the test. An ask that explains itself, happens once, and leaves the app working when refused is what a legitimate request looks like — and a detector that fires on this one will fire on everything.',
  },
  {
    scene: 'The email has an unsubscribe link at the bottom, and one click removes you from the list.',
    correct: 'Nothing here is a dark pattern — leaving costs one click',
    wrong: [
      'A dark pattern, because the link is at the bottom',
      'A dark pattern, since they should not have emailed you in the first place',
      'A dark pattern, because a single click is too easy and people will do it by accident',
    ],
    tempt: '"The link is at the bottom" tempts because burying the exit IS a common dark pattern. Bottom-of-the-email is where every unsubscribe link has lived for twenty years, and one click with no retention screen is the honest version.',
  },
  {
    scene: 'To decline the offer you have to click a button reading "No, I do not want to save money".',
    correct: 'A dark pattern — the refusal is written to make you feel foolish',
    wrong: [
      'Cheeky wording on the button, and honestly nothing more than that one',
      'Honest, since declining does mean paying more than you otherwise would',
      'Acceptable, because the button does exactly what it says it will do when clicked',
    ],
    tempt: '"Declining does mean paying more" tempts because the sentence is arguably accurate. Accuracy is not the issue: the button is written so that refusing requires agreeing out loud with an insult, which is a cost attached to no.',
  },
  {
    scene: 'The free trial takes card details, sends no reminder, and charges on day eight.',
    correct: 'A dark pattern — the charge is designed around you forgetting',
    wrong: [
      'Standard, since free trials all work this way',
      'Fair, since the trial length was stated',
      'Reasonable, since sending reminders would just annoy people who want to continue',
    ],
    tempt: '"The length was stated" tempts because it was, and disclosure feels like it settles things. A business that wanted you to continue on purpose would remind you; the missing reminder is the product decision, and it is aimed at the people who would have cancelled.',
  },
  {
    scene: 'Two identical buttons sit side by side. The one that adds paid extras is where "continue" normally sits.',
    correct: 'A dark pattern — it uses your habits against you',
    wrong: [
      'Bad layout rather than a deliberate trick',
      'Fine, because both buttons are clearly labelled with what they do',
      'Acceptable, since anybody reading the page properly would notice the difference',
    ],
    tempt: '"Anyone reading properly would notice" tempts because it is true, and it quietly moves the blame. Interfaces are designed for how people actually behave, and placing the paid option where the muscle memory goes is a use of that knowledge, not an accident of it.',
  },
]

const infDark = tpl(
  {
    id: 'dd-inf-dark',
    name: 'Dark pattern, or ordinary design?',
    skillIds: ['h-influence'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: DARK_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, DARK_CASES)
    return {
      title: 'Read the interface',
      prompt: `${c.scene}\n\nWhat is going on here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask one question: is the easy path the one that is good for you, or the one that is good for them?',
        'Then check for asymmetry — how much work is yes, and how much work is no?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Two of the situations in this family are perfectly ordinary, on purpose. A skill that labels every interface a trap is not a skill: it makes you distrust the unsubscribe link that actually works, and it stops carrying information the moment it fires on everything. The test is asymmetry — an interface where saying no costs far more than saying yes has made a decision about you, and that is the thing to notice rather than a general suspicion of pages.`,
    }
  },
)

const CLOCK_CASES: Choice[] = [
  {
    scene: '"The programme has to go to the printer by the 7th, because the hall is booked for the 14th and they need a week."',
    correct: 'Real — the printer and the hall set it, not the person asking',
    wrong: [
      'Made up, like every deadline in a message',
      'Real, but only because they say so',
      'Impossible to tell without asking the printer directly about their actual turnaround',
    ],
    tempt: '"Impossible to tell without checking" tempts because checking is usually good advice. This deadline names its cause and the cause is checkable in one question — and a deadline that explains itself is behaving like a real one.',
  },
  {
    scene: '"This price is only good for the next 12 minutes." The same banner said 12 minutes yesterday.',
    correct: 'Manufactured — the same clock ran yesterday and nothing changed',
    wrong: [
      'Real, because the price will genuinely go up',
      'Probably real, since shops do run offers that end at a particular time of day',
      'Impossible to say, since you cannot know what their pricing system does behind the scenes',
    ],
    tempt: '"Shops do run real offers" tempts because they do. The detail that settles it is that the same countdown was running yesterday, which means the clock is a feature of the page rather than a fact about the price.',
  },
  {
    scene: '"Sign-ups close Friday — the coach company needs a final number three days before we travel."',
    correct: 'Nothing here is a pressure tactic — the coach sets the date',
    wrong: [
      'Pressure, because naming any date at all is a way of pushing you',
      'Pressure, because saying so is meant to make people sign up sooner than they would',
      'Impossible to judge, since anybody could claim a coach company was behind their deadline',
    ],
    tempt: '"It is meant to make people sign up sooner" tempts because it is true and it is not what makes something a tactic. A real constraint explained honestly is how organising works; the thing to look for is a clock with nothing behind it.',
  },
  {
    scene: '"I need your answer tonight." When you ask why tonight, the subject changes.',
    correct: 'Manufactured — a real deadline survives being asked about',
    wrong: [
      'Real, since they clearly need to know soon',
      'Real, because people do not usually invent a reason to be in a hurry',
      'Impossible to tell, because there might be a reason they would rather not explain to you',
    ],
    tempt: 'The last one is fair and worth holding — people do have private reasons. It also does not change what you should do, which is to answer on your own clock and say so, since a reason you are not allowed to know cannot be a reason you are asked to act on.',
  },
  {
    scene: '"Applications close at midnight on the 30th", printed on the form and on the school noticeboard.',
    correct: 'Real — it is published, fixed, and the same for everyone',
    wrong: [
      'Pressure, because midnight is a dramatic time',
      'Pressure, since deadlines exist to hurry people',
      'Impossible to judge without knowing whether late applications are quietly accepted anyway',
    ],
    tempt: '"Late ones are probably accepted anyway" tempts because sometimes they are. Planning around a rumour rather than the published date is how people miss things, and a date that is public and identical for everyone has none of the marks of a manufactured one.',
  },
  {
    scene: '"Two other people are asking about it, so I need to know in the next hour."',
    correct: 'Manufactured — the other buyers are unverifiable and so is the hour',
    wrong: [
      'Real, because second-hand things really do sell very quickly to somebody',
      'Real, since a seller is entitled to sell to whoever gets there first with the money',
      'Impossible to tell, and the sensible move is to offer more money to secure it straight away',
    ],
    tempt: 'The last option is the dangerous one, because it accepts the frame and then acts inside it. The correct response to an unverifiable rush is not to bid against a claim; it is to say when you can decide, and to accept that you might lose it.',
  },
  {
    scene: '"The hall must be cleared by six, because the next group has it booked from six."',
    correct: 'Real — the next booking is a fact anyone can check',
    wrong: [
      'Pressure, because it rushes everybody at the end',
      'Pressure, because whoever booked it could easily have arranged more time',
      'Impossible to judge without seeing the booking sheet in the office for yourself',
    ],
    tempt: '"They could have arranged more time" tempts because it might be true and it is an argument about a different decision. The six o\'clock itself is set by somebody else\'s booking and does not move because you would prefer it to.',
  },
  {
    scene: '"Enrolment for this course closes soon." No date is given anywhere on the page.',
    correct: 'Manufactured — "soon" with no date is a feeling, not a deadline',
    wrong: [
      'Real, because courses do have to close at some point',
      'Probably real, since a page like this would not say it without a reason behind it',
      'Impossible to say, and the safest move is to sign up now in case it closes tomorrow',
    ],
    tempt: 'The "sign up now to be safe" option is the whole purpose of the missing date, which is why it deserves naming. A deadline without a date cannot be planned around, and something you cannot plan around is being used to stop you planning.',
  },
  {
    scene: '"Get the form back by Thursday if you can — if that is hard, tell me and we will sort it."',
    correct: 'Nothing here is a pressure tactic — the date bends and says so',
    wrong: [
      'Pressure, since it still names a day and expects you to answer it',
      'Pressure, because "if you can" makes people feel bad about asking for longer',
      'Impossible to judge, since the person might be annoyed if you actually did ask for more time',
    ],
    tempt: '"They might be annoyed if you asked" tempts because that is a real fear. It is a prediction about their reaction rather than a reading of the message, and the message is doing the opposite of applying pressure: it names a date and hands you the exit in the same sentence.',
  },
  {
    scene: '"Offer ends when this page closes." Opening the page again brings the offer straight back.',
    correct: 'Manufactured — the offer follows you, so it never ended',
    wrong: [
      'Real, because the offer did end on that page',
      'Real, since offers get re-run all the time',
      'Impossible to say, because you have no way of knowing how their pricing rules work',
    ],
    tempt: '"They re-run it for people who did not take it" tempts because that does happen. Here it came straight back on the same day to the same person, which makes the ending an animation rather than an event.',
  },
]

const infClock = tpl(
  {
    id: 'dd-inf-clock',
    name: 'Is that deadline real?',
    skillIds: ['h-influence'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: CLOCK_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, CLOCK_CASES)
    return {
      title: 'Real clock, or a painted one?',
      prompt: `${c.scene}\n\nWhat kind of deadline is this?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask who set the time. A real deadline is usually set by somebody who is not asking you for anything.',
        'Then ask what happens when you question it. Real deadlines explain themselves; manufactured ones change the subject or reset.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Three of the ten situations in this family have perfectly real deadlines, and that is the point of the family. Halls do get booked, coaches do need numbers, and forms do close — treating every date as manipulation would make you the person who misses things and annoys the people organising them. The mark of a manufactured clock is specific and checkable: it is set by whoever wants the yes, it does not explain itself, and it survives its own expiry.`,
    }
  },
)

const REFUSE_CASES: Choice[] = [
  {
    scene: 'A classmate asks to copy your coursework the night before it is due, saying they will change the wording.',
    correct: '"No, I am not sending it. I can talk through how I did section two."',
    wrong: [
      '"I would, but my dad checks my files."',
      '"Look, I would honestly love to help and I have thought about it, but the thing is if it got noticed then we would both be in trouble, and I would end up being the one who gets blamed for it because it is my work, so really it is not fair to ask me."',
      '"Maybe — send me a message later tonight and I will see how I feel about it then, because I do not want to just say no straight away when you are stuck like this."',
    ],
    tempt: 'The long explanation feels like the kind and thorough answer. It is also a list of obstacles rather than a limit, so every obstacle can be argued with, and the conversation continues for another twenty minutes.',
  },
  {
    scene: 'A friend wants your account password "just for one evening" so they can use a feature you have paid for.',
    correct: '"No — I do not share logins. Happy to sit with you and use mine."',
    wrong: [
      '"I cannot do that, the account is in my mum\'s name and she checks it."',
      '"I mean, it is not that I do not trust you, obviously I do, it is more that if anything happened on the account then it would come back to me and I would have to explain it, and honestly it is just easier if we do not get into that whole situation in the first place."',
      '"Let me think about it and I will let you know tomorrow, because I do want to help and I know you would do the same for me if it were the other way round."',
    ],
    tempt: 'Putting the account in someone else\'s name tempts because it ends the conversation without an argument. It also makes the rule someone else\'s, so the friend now negotiates with your mum rather than with you, and the ask comes back.',
  },
  {
    scene: 'Someone in the club asks you to take on a third job when you have already said you are at your limit.',
    correct: '"No, I am at my limit. I will keep doing the two I have."',
    wrong: [
      '"I am so incredibly busy at the moment, sorry about that."',
      '"The thing is I really want to help and I know how short we are of people, and I have been trying to work out whether I could squeeze it in somewhere, and maybe if the other two calm down a bit then I could look at it again in a few weeks and see where things are."',
      '"Go on then, but this is definitely the last one — I mean it this time, because I really cannot keep taking things on the way I have been."',
    ],
    tempt: 'The "definitely the last one" answer is the one most people give, and it is the one that guarantees a fourth ask. Saying yes while announcing a limit teaches everybody that the limit is a mood rather than a rule.',
  },
  {
    scene: 'A group member asks you to say you both worked on a section that you wrote alone.',
    correct: '"No, I will say what each of us did. I can help you catch up."',
    wrong: [
      '"I would rather not, if that is all right."',
      '"I am not sure that is a great idea because the teacher will probably ask about it and then one of us will have to answer and it will look worse than just saying what happened, and I do not really want to be in the middle of that when it comes up later on."',
      '"Fine, whatever, but if anyone asks me directly about it then I am going to tell them the truth, so it is on you if it comes out that way in the end."',
    ],
    tempt: 'The last one tempts because it feels like a compromise with your conscience attached. It agrees to the lie, keeps an escape route, and leaves the other person expecting cover they will not get.',
  },
  {
    scene: 'A friend asks you to keep a secret from your parents about where you will both be on Saturday.',
    correct: '"No — I am not lying to them about where we are. Come as we planned."',
    wrong: [
      '"I do not think I can do that, sorry, it is all a bit awkward for me."',
      '"It is not that I mind exactly, it is more that they always seem to find out about this sort of thing somehow and then it turns into a much bigger deal than it needed to be, and I would rather not have that whole conversation for the sake of one afternoon."',
      '"All right, but only this once, and if they ask me anything directly then I am not going to make something up about it, because I am really not good at that."',
    ],
    tempt: 'The "only this once" answer tempts because it keeps the friendship comfortable now. Notice what it also does: it establishes that the answer is negotiable, and the next ask starts from there rather than from your actual position.',
  },
  {
    scene: 'A seller pushes you to buy today because "someone else is looking at it".',
    correct: '"I will decide by Thursday. If it goes before then, that is fine."',
    wrong: [
      '"I need to check with someone first."',
      '"I am definitely interested and I do not want to lose it, but I have not had a chance to look at the other ones yet and I would feel silly buying the first thing I saw, so is there any way you could hold it for me until I have had a proper look around?"',
      '"Could you do it a bit cheaper if I take it right now? Then I would not have to think about it any more and we could both get it sorted this evening."',
    ],
    tempt: 'Asking for a discount to decide immediately tempts because it feels like driving a bargain. It accepts the rush as real and then pays to be rushed, which is the outcome the pressure was for.',
  },
  {
    scene: 'A relative asks you to look after a younger cousin on the afternoon you already have a match.',
    correct: '"I cannot that afternoon — I have a match. Any other day works."',
    wrong: [
      '"That one is really quite difficult for me at the moment, sorry."',
      '"I would honestly love to and I feel bad saying no because I know how hard it is to find anyone at short notice, but I have got this match and I have already told the coach I would be there and if I pull out now they will be a player short and it will be a whole thing."',
      '"I suppose I could see whether someone else can cover the match, and then I would only be missing one game, and it is not as if it is a really important one this week anyway."',
    ],
    tempt: 'Offering to drop the match tempts because it looks generous and it is how people end up with no commitments of their own. A boundary that dissolves whenever the other request is sincere is not a boundary.',
  },
  {
    scene: 'A club member asks you to lend money you would rather not lend.',
    correct: '"No, I do not lend money. I can help you sort something else out."',
    wrong: [
      '"I have not got any on me right now."',
      '"It is not the amount, it is more that last time this happened it got awkward and I did not know how to bring it up again, and I would honestly rather not put either of us in that position because I do not want it to be a thing between us."',
      '"Okay, but I need it back by Friday at the latest, and if you cannot manage that then tell me now so I can work out what I am going to do about the weekend."',
    ],
    tempt: '"I have not got any on me" tempts because it is easy and it ends today\'s conversation. It answers a question about your wallet rather than about your decision, so the ask returns the moment your wallet changes.',
  },
  {
    scene: 'Someone asks you to add your name to a message criticising another student.',
    correct: '"No, leave my name off it. I will talk to them myself if it matters."',
    wrong: [
      '"I would rather stay right out of it, if that is all right with you all."',
      '"I do sort of agree with some of what it says but not all of it, and I think if my name is on there then people will assume I agree with all of it, and then it will look like I was part of putting it together when actually I only saw it this morning."',
      '"Put it on if you want, but do not send it tonight — leave it a couple of days and see whether everyone still feels the same way about it by then."',
    ],
    tempt: 'Delaying tempts because it sounds wise and costs nothing today. It also lends your name to something you do not want to sign, on the theory that the problem will solve itself, which is a decision made by not making one.',
  },
  {
    scene: 'A group asks you to join a challenge you think is a bad idea, and calls you boring for hesitating.',
    correct: '"Not for me. I will be there for the rest of it."',
    wrong: [
      '"I am not really feeling well today."',
      '"I am not saying it is a stupid idea or anything, it is just that I have thought about it and I am not sure it is worth the risk for what it is, and I do not really want to be the one who ends up having to explain what happened if it goes wrong for somebody."',
      '"Fine, I will do it, but only if everybody else goes first and I get to see how it goes before I decide whether I am actually doing it or not."',
    ],
    tempt: 'Being called boring is the whole tactic, and the long justification is the answer it is designed to produce — arguing the merits accepts that your reasons are up for debate. "Not for me" refuses without a foothold, and the second sentence keeps the friendship.',
  },
]

const infRefuse = tpl(
  {
    id: 'dd-inf-refuse',
    name: 'Refusing without arguing about it',
    skillIds: ['h-influence', 'h-boundary'],
    bucket: INSIGHT,
    difficulty: 4,
    variants: REFUSE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, REFUSE_CASES)
    return {
      title: 'The refusal that holds',
      prompt: `${c.scene}\n\nWhich response actually refuses?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A refusal that holds has two parts: the limit, and what you WILL do. It does not have a third part explaining itself.',
        'Watch for excuses. An excuse is a fact about today, so it invites the same ask tomorrow — a limit is about you, and it does not expire.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `The reason short is better here has nothing to do with being blunt. Every reason you give is a thing that can be argued with, so a long justification hands the other person a list of doors to try — and if they get through one, you have agreed that the reasons were the point rather than your answer. A limit plus a genuine offer is warm and finished at the same time: nothing has been said about them, and there is nothing left to negotiate.`,
    }
  },
)

// ===========================================================================
// h-boundary — a limit you can keep alone, cooling it down, and who it belongs to
// ===========================================================================

const OWN_ACTION_CASES: Choice[] = [
  {
    scene: 'A group chat you are in keeps roasting one member. You have asked twice for it to stop.',
    correct: '"I am muting this chat while that is going on. Message me directly."',
    wrong: [
      '"Everyone has to stop the roasting now."',
      '"If one more person posts a roast about him then I am taking the whole thing to a teacher and letting them deal with it."',
      '"I really hope people will have a think about how all that comes across to somebody who has to read it every day."',
    ],
    tempt: 'The teacher threat tempts because it has teeth. A threat you are not going to carry out this week costs you the next one as well, and the chat can simply wait to see whether you meant it.',
  },
  {
    scene: 'A friend keeps borrowing your things and giving them back a fortnight late.',
    correct: '"I am not lending things out at the moment. Ask me again in a while."',
    wrong: [
      '"You need to bring things back on time."',
      '"Every single time I lend you something it takes weeks to get back and I end up having to ask you about it three or four times before anything actually happens."',
      '"It would be really good if people could just return things when they said they would, because it is not much to ask of anybody."',
    ],
    tempt: '"You need to bring things back on time" tempts because it names exactly the behaviour that is wrong. It is also a rule for somebody else, so keeping it is entirely up to them — and they have already shown you what they do with it.',
  },
  {
    scene: 'A relative comments on what you are eating at every single meal.',
    correct: '"When that comes up I am going to change the subject or step out."',
    wrong: [
      '"Please stop commenting on what is on my plate at every single meal."',
      '"If you say one more thing about what is on my plate then I am not coming to Sunday lunch here again, and I mean it this time."',
      '"I wish people would just keep their opinions about other people\'s food to themselves, honestly, because nobody actually finds it helpful."',
    ],
    tempt: 'The polite request tempts because it is the reasonable thing to say and it may well work. If it does not, you are back where you started; a limit that names your own next move works whether or not they agree to anything.',
  },
  {
    scene: 'A teammate keeps messaging at midnight asking for your homework answers.',
    correct: '"I am turning my phone off at ten. I can help you at lunch."',
    wrong: [
      '"Stop messaging me so late at night."',
      '"You cannot keep doing this because I have to be up early and then I am tired all day and it affects my own work as well as everything else I have got on."',
      '"Maybe try starting a bit earlier in the evening and then you would not be stuck at midnight needing somebody else to bail you out of it."',
    ],
    tempt: 'The advice about starting earlier tempts because it is genuinely good advice. Advice is not a limit, and giving it at midnight is a conversation you are having at midnight — which is the thing you wanted to stop.',
  },
  {
    scene: 'Someone keeps using a nickname for you that you have asked them twice to drop.',
    correct: '"I am not answering to that. I will answer to my name."',
    wrong: [
      '"You have really got to stop calling me by that name now."',
      '"I have already asked you about this twice now and it is starting to feel like you are doing it deliberately, which is not really what I would expect from a friend."',
      '"It would be nice if people could just use the name somebody actually asks to be called, rather than whatever they have decided is funnier."',
    ],
    tempt: 'Reading it as deliberate tempts because twice does look pointed. It also turns a small limit into an argument about their intentions, which is the one thing neither of you can settle.',
  },
  {
    scene: 'A group keeps making plans that quietly assume your dad will drive everyone.',
    correct: '"I am not offering lifts any more. Sort the travel before you plan."',
    wrong: [
      '"You lot need to stop assuming that my dad is going to drive everyone."',
      '"My dad has actually got his own things on at the weekend and he has done it about four times already this term without anybody even asking him properly first."',
      '"It would be good if somebody else offered occasionally, because it always seems to end up being the same person doing all of the driving."',
    ],
    tempt: 'Explaining how much your dad has already done tempts because it is the fairest-sounding case. It also argues about the past, which can be disputed, instead of stating what happens from now, which cannot.',
  },
  {
    scene: 'A friend has twice shared screenshots of your messages with other people.',
    correct: '"I am keeping the private things off messages with you from now on."',
    wrong: [
      '"You cannot send my messages to other people."',
      '"I do not really understand why you would take something I sent you and forward it on, because I would never do that to you and I thought that was obvious between us."',
      '"People should not screenshot private conversations, it is one of those things everybody knows and somehow still does anyway."',
    ],
    tempt: '"I would never do that to you" tempts because it is true and it feels like it should land. It is an appeal to fairness, which only works on somebody who agrees — and the thing you can control is what you write next.',
  },
  {
    scene: 'A club member talks over you every time you start a sentence in meetings.',
    correct: '"When I get cut off I am going to say so and finish."',
    wrong: [
      '"You have got to stop interrupting people mid-sentence."',
      '"It happens to me more than it happens to anybody else in that room and after a while you start wondering whether it is actually about what I am saying or about me."',
      '"Meetings would work much better if everybody let people get to the end of a sentence before jumping in with their own point."',
    ],
    tempt: 'The general observation about meetings tempts because it avoids naming anyone. Nothing addressed to everybody is addressed to anybody, and the next meeting runs exactly as the last one did.',
  },
  {
    scene: 'A friend turns up an hour late to everything you arrange together.',
    correct: '"I am starting at the time we said. Join me when you get there."',
    wrong: [
      '"You have to turn up at the time you say you are going to turn up."',
      '"I have been sat on my own for an hour three times now and it makes me feel like the arrangement matters more to me than it does to you, which is not a nice thing to sit there thinking."',
      '"Perhaps set an alarm a bit earlier, because it seems to be the getting-ready part that catches you out rather than the journey itself."',
    ],
    tempt: 'The honest feeling in the second option is worth saying and it is not a boundary. Say it if you want to be understood; say the first one if you want to stop spending hours on your own.',
  },
  {
    scene: 'A parent keeps reading over your shoulder while you are working on your laptop.',
    correct: '"I am going to work in the other room when that happens."',
    wrong: [
      '"You need to stop reading my screen."',
      '"I am not hiding anything and that is not the point, the point is that I cannot concentrate when I know somebody is reading every word as I am typing it out."',
      '"Most people would find it uncomfortable to have somebody stood behind them reading whatever they happen to be writing at the time."',
    ],
    tempt: '"I am not hiding anything" tempts because it heads off the obvious reply. It also accepts the frame that you would need a reason, and the whole point of a boundary is that it does not require one to be granted.',
  },
]

const bndOwnAction = tpl(
  {
    id: 'dd-bnd-own-action',
    name: 'A limit you can keep on your own',
    skillIds: ['h-boundary'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: OWN_ACTION_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, OWN_ACTION_CASES)
    return {
      title: 'Whose behaviour does it depend on?',
      prompt: `${c.scene}\n\nWhich one is a limit you can keep **whatever they decide to do**?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask of each option: who has to change for this to be true? If the answer is them, it is a request, not a limit.',
        'A limit you can keep alone names your own next move. It also does not need them to agree that you are right.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Requests are fine, and usually the right thing to try first — most people simply stop when asked. This is what you say when asking has not worked, and the difference is that it does not hand your comfort to somebody who has already shown you what they do with it.\n\n` +
        `Two honest limits on this. It stops the thing landing on you; it does not make the other person change, and pretending otherwise sets you up to feel that your limit "failed". And it is the wrong tool entirely where somebody could be hurt, or where an adult or a near-stranger is pressing a young person to keep secrets from their parents — those are not boundary-wording problems, and they go to a trusted adult straight away.`,
    }
  },
)

const COOL_CASES: Choice[] = [
  {
    scene: 'A friend accuses you, in front of four other people, of passing on their news.',
    correct: '"That landed hard. Can we do this outside, just us?"',
    wrong: [
      '"I did not do that, and you know perfectly well I did not."',
      '"Right, well since we are doing this in front of everybody, shall we talk about the thing you told half the year about me in October?"',
      'Say nothing at all, let it go, and then spend the next three days deciding whether the friendship is worth carrying on with.',
    ],
    tempt: 'Bringing up October tempts because it is the strongest card you have and it is even relevant. It converts one person\'s outburst into a two-person fight with an audience, and nothing after that is about what actually happened.',
  },
  {
    scene: 'Your parent raises their voice about the state of the kitchen.',
    correct: 'Drop your volume: "You are right, it is a mess. Doing it now."',
    wrong: [
      '"All right, calm down a bit, it is only a kitchen at the end of it."',
      '"I was going to do it in a minute, and anyway I am not the only person who has used that kitchen today, so I do not see why it is always me who gets it."',
      'Go upstairs without answering, do nothing about the kitchen, and wait for it to come up again in a couple of days.',
    ],
    tempt: '"Calm down, it is only a kitchen" tempts because it feels de-escalating and reliably does the opposite. It dismisses the feeling and orders its removal in the same breath, which is the fastest way to double a voice.',
  },
  {
    scene: 'A teammate loudly blames you for a goal that went in off your foot.',
    correct: '"Fair enough, it came off me. Where do you want me next time?"',
    wrong: [
      '"Nothing to do with me, that was your marking."',
      '"You have given away two all season and nobody says a word about it, so maybe have a look at your own game before you start on mine in front of everyone."',
      'Say nothing at all, play the rest of the match in silence, and bring it up with somebody else in the changing room afterwards.',
    ],
    tempt: 'The scoreboard reply tempts because it is true and it is proportionate. It also guarantees the next twenty minutes are about who is worse rather than about the shape of the defence, which is the only thing either of you can fix.',
  },
  {
    scene: 'A club member says in a meeting that the rota has been rigged against them.',
    correct: '"You are annoyed about it. Show me the weeks and we will look."',
    wrong: [
      '"That is a ridiculous thing to say."',
      '"Nobody has rigged anything and frankly it is a bit insulting to the people who spend their evenings putting the rota together for everyone else\'s benefit."',
      'Move straight on to the next item as though nothing has been said, and hope the whole thing goes away by the next meeting.',
    ],
    tempt: 'Defending the rota-makers tempts because the accusation is unfair to them. It answers the accusation instead of the person, so the meeting now has two arguments running and the actual weeks nobody has looked at.',
  },
  {
    scene: 'A younger sibling is shouting at you about something you did not do.',
    correct: 'Sit down and go quiet: "You are really upset. What happened?"',
    wrong: [
      '"It was not me, so there is no point in you shouting at me about it."',
      '"Do you have any idea how often this happens? Every single time something goes wrong in this house it is apparently my fault and nobody ever checks whether it actually was."',
      'Match their volume exactly, so that they get to hear what it sounds like from the other side of a conversation.',
    ],
    tempt: 'Matching the volume tempts because it feels like a lesson. Volume is contagious in both directions, which is the whole lever: going lower and slower is the only move that reliably changes the level of the room.',
  },
  {
    scene: 'Someone in a shared room turns the music up after you asked for it down.',
    correct: '"I am not going to argue about it. I will work in the library."',
    wrong: [
      '"Turn it down, I already asked you."',
      '"I asked you politely about thirty seconds ago and you have actually made it louder, which I think tells me everything about how much notice you take of anybody else in this room."',
      'Turn it off at the wall while they are out of the room, and say nothing at all about having done it.',
    ],
    tempt: 'Turning it off at the wall tempts because it solves the problem in four seconds. It also starts the next round without you being in the conversation, and the version of this that ends is the one where you leave.',
  },
  {
    scene: 'A friend sends a long, angry message at midnight.',
    correct: '"I want to get this right, so I will answer properly tomorrow."',
    wrong: [
      '"It is midnight. I am not doing this now."',
      '"There is a lot in that message that is not fair and I am going to go through it point by point, because half of what you have said there did not even happen the way you have written it."',
      'Read it four times, write nothing at all, and leave it unanswered until they message again to ask why you are ignoring them.',
    ],
    tempt: 'Answering point by point tempts because the message is genuinely unfair in places. Midnight is the worst possible time to correct anybody, and a reply that opens with a list of their errors will not be read as a correction.',
  },
  {
    scene: 'A classmate says you got them into trouble, and about half of it is true.',
    correct: '"The message part is on me. The rest of it I did not do."',
    wrong: [
      '"None of that was actually my fault at all, and you know it."',
      '"I think you are being a bit unfair because you were the one who decided to do it in the first place and I only mentioned it afterwards when somebody asked me a direct question about it."',
      'Take the blame for all of it, apologise for the parts that were not yours, and hope the whole thing stops there.',
    ],
    tempt: 'Taking all of it tempts because it ends the conversation fastest and looks generous. It also agrees to a version of events that is not true, which is a debt you will be asked to pay again next time it comes up.',
  },
  {
    scene: 'You and a parent are both making the same point for the third time.',
    correct: '"We are going round. Shall we come back to it after dinner?"',
    wrong: [
      '"You are not even listening to me."',
      '"I have explained this three times now in three different ways and you keep saying the same thing back at me as if I have not said anything at all, which is why we are still stood here."',
      'Keep going until one of you gives up out of tiredness, since somebody has to and it might as well not be you.',
    ],
    tempt: '"You are not listening" tempts because it is often accurate at round three. It is also a claim about them that they will dispute, so it adds a fourth round rather than ending the third.',
  },
  {
    scene: 'Somebody corrects you sharply in front of the class, and they are right.',
    correct: '"Yes — you are right. Thanks." And leave it there.',
    wrong: [
      '"All right, there was no need to say it quite like that."',
      '"I did actually know that, I just said it wrong because I was reading off the sheet and the numbers were the wrong way round on there in the first place."',
      'Say nothing, go red, and spend the rest of the lesson working out what you should have said back to them.',
    ],
    tempt: 'Objecting to the tone tempts because the tone was genuinely sharp, and you are entitled to mind. Doing it in the same public moment trades a correction you can absorb in four words for an exchange the whole room now watches.',
  },
]

const bndCool = tpl(
  {
    id: 'dd-bnd-cool',
    name: 'What actually lowers the temperature',
    skillIds: ['h-boundary', 'h-emotion'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: COOL_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, COOL_CASES)
    return {
      title: 'Cool it down',
      prompt: `${c.scene}\n\nWhat actually brings the temperature down?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'The first move is yours and internal: one breath, and your volume below theirs.',
        'Then acknowledge the feeling or the true part, and move to something specific — or leave. Never argue with the feeling itself.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Composure is not the same as absorbing it. Two of the wrong answers in each of these are versions of taking it silently, and they schedule the argument for later instead of cancelling it — usually with interest, and usually in front of somebody else. What de-escalation buys you is a next move that you CHOSE, which may still be a firm one.`,
    }
  },
)

interface HeatCase {
  scene: string
  /** 0 = lowers the temperature, 1 = raises it. */
  statements: { text: string; category: number }[]
  note: string
}

const HEAT_CASES: HeatCase[] = [
  {
    scene: 'An argument with a friend about a plan that fell through.',
    statements: [
      { text: '"I can see why that was annoying"', category: 0 },
      { text: '"Tell me what happened from your side"', category: 0 },
      { text: '"Shall we sort this out tomorrow?"', category: 0 },
      { text: '"You are overreacting about this"', category: 1 },
      { text: '"This is exactly what you always do"', category: 1 },
      { text: '"Everyone else thinks so too, by the way"', category: 1 },
    ],
    note: '"Everyone else thinks so too" is the sharpest escalator on the list, because it turns a disagreement between two people into a verdict from a crowd — and there is no reply to it that is not a fight.',
  },
  {
    scene: 'A disagreement with a parent about a rule at home.',
    statements: [
      { text: '"I do not agree, but I have heard you"', category: 0 },
      { text: '"What are you actually worried about?"', category: 0 },
      { text: '"Can we talk about it when it is calmer?"', category: 0 },
      { text: '"You never let me do anything"', category: 1 },
      { text: '"Nobody else has parents like this"', category: 1 },
      { text: '"Fine. Whatever you say."', category: 1 },
    ],
    note: '"Fine, whatever you say" is in the raising column and it surprises people. It ends the noise and not the argument, and everybody in the room can hear the difference.',
  },
  {
    scene: 'A row in a group project two days before it is due.',
    statements: [
      { text: '"Let us list who has got what"', category: 0 },
      { text: '"The bit about my section is fair"', category: 0 },
      { text: '"What would help most in the next hour?"', category: 0 },
      { text: '"You have done nothing since September"', category: 1 },
      { text: '"I am telling the teacher about this"', category: 1 },
      { text: '"Some of us actually care about our marks"', category: 1 },
    ],
    note: 'Conceding the true part is the most reliable cooler there is, and the hardest to do while a room is loud. It removes the thing the other person is bracing to defend.',
  },
  {
    scene: 'A disagreement in a club meeting about how a decision was taken.',
    statements: [
      { text: '"Let us go back and look at the minutes"', category: 0 },
      { text: '"You are right that you were not asked"', category: 0 },
      { text: '"How would you want it done next time?"', category: 0 },
      { text: '"This is a waste of everybody\'s evening"', category: 1 },
      { text: '"If you do not like it, stand for committee"', category: 1 },
      { text: '"Nobody else has had a problem with it"', category: 1 },
    ],
    note: '"If you do not like it, stand for committee" is the one that sounds most like a fair challenge. It answers a complaint by questioning the standing of the person making it, which is a way of not answering it.',
  },
  {
    scene: 'A message thread with a friend that is getting sharper.',
    statements: [
      { text: '"I do not think this is working over text"', category: 0 },
      { text: '"Have I got this right — you meant that?"', category: 0 },
      { text: '"I am going to stop and answer tomorrow"', category: 0 },
      { text: '"Read back what you sent me at four"', category: 1 },
      { text: '"I have screenshotted all of this"', category: 1 },
      { text: '"Do not bother replying to any of it"', category: 1 },
    ],
    note: '"I have screenshotted this" is escalation with a receipt: it announces that the conversation is now evidence, and nobody speaks freely to a record.',
  },
  {
    scene: 'A falling-out between two friends that you are standing next to.',
    statements: [
      { text: '"You both want the same weekend to work"', category: 0 },
      { text: '"Can I say what I think I am hearing?"', category: 0 },
      { text: '"Shall we get a drink and come back?"', category: 0 },
      { text: '"Honestly, she has a point about you"', category: 1 },
      { text: '"You two are as bad as each other"', category: 1 },
      { text: '"I am staying out of this one entirely"', category: 1 },
    ],
    note: '"I am staying out of it" reads as neutral and lands as abandonment in the middle of a row, which is why it is in the raising column. Staying out is often right; announcing it mid-argument is a different act.',
  },
  {
    scene: 'A dispute with a sibling about something that got broken.',
    statements: [
      { text: '"I am not going to shout about it"', category: 0 },
      { text: '"Show me and we will see what it needs"', category: 0 },
      { text: '"I know you did not mean it to happen"', category: 0 },
      { text: '"You ruin everything you touch"', category: 1 },
      { text: '"I am telling them the second they are in"', category: 1 },
      { text: '"Do you remember what you did in April?"', category: 1 },
    ],
    note: '"Do you remember April" opens a second argument inside the first one. Old material is the most reliable escalator in families, because it is always available and it can never be settled.',
  },
  {
    scene: 'A tense conversation about who gets the shared room this evening.',
    statements: [
      { text: '"What do you actually need it for?"', category: 0 },
      { text: '"I can take the early half if that helps"', category: 0 },
      { text: '"We are both tired — five minutes?"', category: 0 },
      { text: '"I was here first, so that is that"', category: 1 },
      { text: '"You had it twice last week as well"', category: 1 },
      { text: '"I will just go and use the kitchen then"', category: 1 },
    ],
    note: 'The last one is the interesting case: leaving is often a good move, and leaving with a sigh and a pointed sentence is a move in the argument rather than an exit from it.',
  },
]

const bndHeat = tpl(
  {
    id: 'dd-bnd-heat',
    name: 'Up or down?',
    skillIds: ['h-boundary'],
    bucket: INSIGHT,
    difficulty: 2,
    variants: HEAT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, HEAT_CASES)
    return {
      title: 'Sort the next sentences',
      prompt: `${c.scene}\n\nSort each thing you could say next: does it bring the temperature **down**, or push it **up**?`,
      answer: classify(rng, ['Lowers it', 'Raises it'], c.statements),
      hints: [
        'Ask what each sentence gives the other person to do. Something to answer lowers it; something to defend raises it.',
        'Watch the ones that sound calm — a sigh, a withdrawal, or a mention of evidence can raise the temperature without raising a voice.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation:
        `${c.statements
          .map((s) => `**${['Down', 'Up'][s.category]}**: ${s.text}`)
          .join('. ')}.\n\n${c.note}\n\n` +
        `The three coolers in each of these are doing one of three things: acknowledging a feeling, conceding a true part, or moving the conversation to a better time or place. None of them requires you to agree that you were wrong, and none of them is the same as giving in — which is what makes them usable when you actually do think you are right.`,
    }
  },
)

const AGAIN_CASES: Choice[] = [
  {
    scene: 'You said you are not sending your coursework. They ask again, with a longer explanation of how stuck they are.',
    correct: '"My answer is the same. I will help you start it at lunch."',
    wrong: [
      '"Please stop asking me about it."',
      '"I do genuinely feel bad about it and I know you are in a really difficult position with the deadline, so let me think about it overnight and I will message you first thing in the morning about it."',
      '"Fine, but you have to change enough of it that nobody could tell, and if anyone ever asks me about it then I am going to say that I had nothing to do with any of it."',
    ],
    tempt: '"Let me think about it overnight" tempts because it is kinder than a flat no. What it actually says is that the answer moves when enough pressure is applied, which turns one ask into a campaign.',
  },
  {
    scene: 'You said you are not going to the thing on Saturday. They bring it up for the fourth time.',
    correct: '"Still no. Text me about the Sunday one and I will come."',
    wrong: [
      '"I have already told you about this three times now, honestly."',
      '"It is not that I do not want to see everyone, it is more that I have got a lot on this weekend and I have been really tired all week and I do not think I would be any fun to be around anyway."',
      '"All right, I will come for an hour, but I am leaving early and I do not want anyone giving me a hard time about it when I do."',
    ],
    tempt: 'The one-hour compromise tempts because it looks like meeting them halfway. Nobody asked for half; they asked four times for all of it, and the fourth ask has now been rewarded.',
  },
  {
    scene: 'You said you cannot lend the money. They ask again, mentioning something they once did for you.',
    correct: '"The answer is no. I am glad we help each other out."',
    wrong: [
      '"I already said no to this the first time that you asked."',
      '"I know you helped me out with the trip money last year and I have not forgotten about it, but this is a different situation and honestly things are quite tight for me at the moment as well."',
      '"How much do you actually need? Maybe I could do half of it if you can definitely get it back to me before the end of the month."',
    ],
    tempt: 'Explaining why this is different tempts because the debt claim deserves an answer. Answering it puts your finances up for debate; holding both halves — glad we help each other, and still no — leaves nothing to argue with.',
  },
  {
    scene: 'You said you are not taking the third club job. The committee asks again in front of everyone.',
    correct: '"No, and I am happy to keep doing the two I have."',
    wrong: [
      '"I told you last week that I could not take it on."',
      '"I really do understand that we are short of people and I feel awful about it, but I have got exams coming up and I am already doing more than I probably should be doing and I do not want to end up doing all three badly."',
      '"If nobody else puts their hand up in the next fortnight then I suppose I could look at it again, because somebody is going to have to do it in the end."',
    ],
    tempt: 'The "if nobody else volunteers" answer tempts because it feels like a fair condition. Nobody else will volunteer while a fallback exists, so the condition is a yes with a delay in front of it.',
  },
  {
    scene: 'You asked them to stop making jokes about your accent. They do it again and say you cannot take a joke.',
    correct: '"I have asked you to drop it. Drop it."',
    wrong: [
      '"I can take a joke perfectly well, actually."',
      '"It is not about not being able to take a joke, it is that it is the same joke every single time and after a while it stops being funny and starts feeling like something else entirely."',
      '"All right, fine, but only when it is just us and not when there are other people around, because that is the bit that actually bothers me about it."',
    ],
    tempt: '"I can take a joke" tempts because it is the thing you most want to say. It accepts the frame that your sense of humour is the subject, and the conversation is now about you rather than about the request you made.',
  },
  {
    scene: 'You said you are not sharing your login. They say everyone does it and ask a second time.',
    correct: '"No. That one is not up for discussion — but come round and use mine."',
    wrong: [
      '"I am not allowed to, my parents check."',
      '"I know people do share them and I am not saying you would do anything with it, it is more that if something went wrong on the account then it would come back to me and I would have to explain how somebody else was on it."',
      '"I could change the password to something temporary and then change it back afterwards, so that you can get on it for the evening without it being a problem."',
    ],
    tempt: 'The temporary-password workaround tempts because it looks like a clever compromise. It is a yes with extra steps, and it teaches that a second ask produces creative thinking on your side rather than an answer.',
  },
  {
    scene: 'You told a seller you would decide by Thursday. They message twice more the same day.',
    correct: '"Thursday, as I said. Sell it before then if you need to."',
    wrong: [
      '"Please stop messaging me about it every couple of hours today."',
      '"I am still definitely interested and I do not want you to think that I am not, it is just that I said I would look at a couple of others first and I have not had a chance to do that yet because of work."',
      '"Could you hold it for me until Thursday if I send you a bit of a deposit now? Then neither of us has to worry about it going in the meantime."',
    ],
    tempt: 'Offering a deposit tempts because it converts the pressure into a small, concrete action. It is also paying money to keep an option you already had until Thursday, which is exactly the outcome the extra messages were for.',
  },
  {
    scene: 'You told a friend you will not keep a secret from your parents. They push again, saying you are overreacting.',
    correct: '"No. I am not doing that, and I would rather say so now."',
    wrong: [
      '"You are putting me in a bad position."',
      '"I am not trying to make a big thing out of it and I do not think you are doing anything terrible, it is just that I am really bad at that sort of thing and it always comes out wrong when I try."',
      '"I will not say anything unless somebody asks me directly, and then I am going to tell them, so you would need to be all right with that as the arrangement."',
    ],
    tempt: 'The conditional silence tempts because it feels like a middle path. It agrees to the arrangement while reserving an exit, so both of you are now relying on something neither of you has actually agreed to.',
  },
]

const bndAgain = tpl(
  {
    id: 'dd-bnd-again',
    name: 'They asked again',
    skillIds: ['h-boundary'],
    bucket: INSIGHT,
    difficulty: 4,
    variants: AGAIN_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, AGAIN_CASES)
    return {
      title: 'The second ask',
      prompt: `${c.scene}\n\nWhat do you say now?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'You have already given your reasons. A second round of reasons is a second chance to have them argued with.',
        'Restate the answer once, keep the warmth, and offer the thing you actually can do. Then stop.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `What the second ask is testing is not whether you have good reasons; it is whether the answer moves under pressure. Anything that reopens the reasoning — a longer explanation, a condition, a half-yes, a "let me think about it" — answers that question with a yes, and the next ask starts from there.\n\n` +
        `And where the asking keeps going after a plain answer, or comes with pressure to keep it from your parents, it has stopped being a conversation about the thing being asked for. That is the point to tell somebody you trust rather than to find a better sentence.`,
    }
  },
)

/**
 * Four answers of near-identical length, deliberately. Every one of them is the
 * key for some situations, so a length difference between them would hand over
 * the answer on the ones where it is not.
 */
const BELONGS = [
  'Yours to handle — one clear sentence does it all',
  'Worth taking somebody with you when you raise it',
  'This one goes to an adult who can act, and today',
  'Leave it — this one will most likely settle down',
]

const ESCALATE_CASES: { scene: string; key: number; note: string }[] = [
  {
    scene: 'Two friends fell out at lunch and were talking normally again by the end of the afternoon.',
    key: 3,
    note: 'Nothing here needs a plan. Most small friction between people who like each other resolves on its own, and stepping in would give it more weight than it has.',
  },
  {
    scene: 'A friend has been repeating something you told them privately.',
    key: 0,
    note: 'This is exactly the size of thing one sentence handles: what happened, and what you want to be different. It only gets bigger if it is left.',
  },
  {
    scene: 'Your test mark has been added up wrong and comes to four marks less than the paper shows.',
    key: 2,
    note: 'The person who can fix this is the teacher, and today is better than next week because marks get entered. Going to an adult is not always about seriousness — sometimes it is just about who has the power to change the thing.',
  },
  {
    scene: 'The fire door in the drama store has been propped open with a chair since the start of term.',
    key: 2,
    note: 'Anything where somebody could be hurt goes to an adult immediately, and it does not matter that it has been like that for weeks or that nobody else has mentioned it. Being the person who says something is the whole job here.',
  },
  {
    scene: 'You and a group member disagree about who is writing which section.',
    key: 0,
    note: 'An ordinary disagreement about work, and the fix is a two-minute conversation naming the sections. Taking it to a teacher first would make a small thing into a complaint.',
  },
  {
    scene: 'You want to tell the whole committee that the rota is unfair, and you will be the only one saying it.',
    key: 1,
    note: 'Nothing here is beyond you; the difficulty is standing alone in a room of eight. Somebody beside you who has seen the same thing changes the odds without changing the argument.',
  },
  {
    scene: 'Money has gone missing from the club float, and nobody has been able to account for it.',
    key: 2,
    note: 'Missing money is not yours to investigate, and trying to work out who took it is how ordinary explanations get turned into accusations. Hand it to the adult who is responsible for the float.',
  },
  {
    scene: 'A form has gone in with your name on it for a trip you never signed up for.',
    key: 2,
    note: 'The organiser can fix this in one email, and only they can. This is the "who has the power" case again, and it is a large share of the times a young person should go to an adult.',
  },
  {
    scene: 'Three people are owed money by the same person, and you have all been putting off asking.',
    key: 1,
    note: 'Asking together is not ganging up; it is one conversation instead of three awkward ones, and it removes the possibility of each of you being told a different story.',
  },
  {
    scene: 'Someone keeps taking food from the shared fridge that is not theirs.',
    key: 0,
    note: 'Annoying, ordinary, and answerable in one sentence to the person or the group. It becomes something bigger only if it carries on after being named.',
  },
]

const bndEscalate = tpl(
  {
    id: 'dd-bnd-escalate',
    name: 'Whose problem is this?',
    skillIds: ['h-boundary'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: ESCALATE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ESCALATE_CASES)
    const key = BELONGS[c.key]
    return {
      title: 'Sort it by who can act',
      prompt: `${c.scene}\n\nWho does this one belong to?`,
      answer: mcq(rng, key, BELONGS.filter((b) => b !== key)),
      hints: [
        'Two questions do most of the work: could somebody be hurt, and who actually has the power to change this?',
        'Handling something yourself is not braver than asking. Bringing somebody in is the right answer whenever they are the only person who can act.',
        `Worked path: **${key}**.`,
      ],
      explanation:
        `**${key}**. ${c.note}\n\n` +
        `Most of what happens between people is the first or the last option, and reaching for an adult over ordinary friction costs you the practice at saying things yourself. Two kinds of situation are never a judgement call, and this is not an exercise about them: **anything where somebody could be hurt**, and **anyone — especially an adult or someone you have only met online — pressing you to keep something secret from your parents**. Those go to a trusted adult straight away, and the pressure to keep it quiet is itself the reason to tell. If you or a friend are in real distress, in the US you can call or text 988 at any time; if anyone is in immediate danger, that is 911.`,
    }
  },
)

// ===========================================================================
// h-attribution, h-projection, h-interests, h-repair — one each, on angles
// items/readingSituations.ts does not cover
// ===========================================================================

const ASK_CASES: Choice[] = [
  {
    scene: 'A group member has missed two deadlines and you are about to message them.',
    correct: '"What is getting in the way of the Tuesday one?"',
    wrong: [
      '"Why do you always leave everything so late?"',
      '"Do you actually care whether this project goes well, because from here it really does not look like you do?"',
      '"Is there a reason you are treating this as though it does not matter as much as it does to the rest of us?"',
    ],
    tempt: 'The last one tempts because it sounds like a question and it is careful in tone. It has the verdict built into it, so the only available replies are agreeing with it or denying it — neither of which tells you what happened on Tuesday.',
  },
  {
    scene: 'A friend has cancelled three times in a row and you want to know what is going on.',
    correct: '"Three in a row — is something making Thursdays hard?"',
    wrong: [
      '"Why do you keep letting me down?"',
      '"Are you avoiding me, because you can just say so and I would rather know than keep arranging things that never actually happen?"',
      '"Is there a reason you keep saying yes to things you have clearly got no intention of turning up to in the end?"',
    ],
    tempt: '"Are you avoiding me" tempts because it feels brave and direct, and it is honest about the fear. It also names one explanation and asks them to confirm or deny it, so every other explanation now has to fight its way into the conversation.',
  },
  {
    scene: 'A teammate has been quiet at training for a fortnight.',
    correct: '"You have been quiet lately — anything up?"',
    wrong: [
      '"Why have you got such a face on all the time?"',
      '"Have you gone off the team, because that is what it looks like from where the rest of us are standing at the moment?"',
      '"Is there some reason you have decided to stop talking to any of us at training these past couple of weeks?"',
    ],
    tempt: '"Have you gone off the team" tempts because it is the reading you have already formed, and asking it feels like checking. Offering somebody a single explanation to agree with is not checking; it is asking them to sign something.',
  },
  {
    scene: 'Your sister has been snapping at you all week and you want to raise it.',
    correct: '"You have been short with me this week — what is going on?"',
    wrong: [
      '"Why have you been so completely impossible with me all week?"',
      '"Have I done something, because if I have then I would rather you just told me instead of taking it out on me all week?"',
      '"Is there any particular reason you have decided that everything I say to you this week is going to get bitten off?"',
    ],
    tempt: '"Have I done something" tempts because it sounds humble. It puts one explanation on the table with you at the centre of it, and it invites either a reassurance or an argument rather than the answer.',
  },
  {
    scene: 'A club member has stopped replying to committee messages.',
    correct: '"We have not heard from you — is the timing still working?"',
    wrong: [
      '"Why are you ignoring all of us now?"',
      '"Have you lost interest in the club, because if you have then it would be much easier for everyone if you just said so and we could plan around it?"',
      '"Is there a reason the rest of the committee is being left to guess what is happening with the jobs you agreed to do?"',
    ],
    tempt: 'The middle option tempts because it offers them an easy exit and sounds practical. It also decides in advance that losing interest is what happened, and a person who has been ill or overloaded now has to correct you before they can answer.',
  },
  {
    scene: 'A parent has said no to three things in a row and you want to understand it.',
    correct: '"That is three noes — is something going on I do not know about?"',
    wrong: [
      '"Why do you never let me do anything?"',
      '"Have you just decided that the answer is going to be no from now on, because that is what it feels like from where I am standing?"',
      '"Is there a reason you have started saying no to things you would have been completely fine with a month ago?"',
    ],
    tempt: 'The last option tempts because it points at a real change and sounds reasonable. "You have started" is still a claim about them, so the reply defends the change rather than explaining it — and money, work or a promise to somebody else never gets mentioned.',
  },
  {
    scene: 'A friend gave your idea to the class as though it were theirs.',
    correct: '"That was the thing I said on Friday — what happened there?"',
    wrong: [
      '"Why did you take the credit for my idea in front of them all?"',
      '"Did you deliberately pass that off as yours, because it certainly looked that way to me and to everyone else sitting near us?"',
      '"Is there a reason you decided the idea was yours to give away once you were the one being asked about it in front of everybody?"',
    ],
    tempt: '"Did you do it deliberately" tempts because deliberateness is the thing you actually want to know. It is also the one thing they can simply deny, and asking it first means you never hear the version where the teacher put them on the spot.',
  },
  {
    scene: 'Someone in your class has stopped sitting with your group and you want to ask.',
    correct: '"We have not seen you at lunch — where are you these days?"',
    wrong: [
      '"Why have you dropped us all of a sudden?"',
      '"Have you fallen out with one of us, because if something has happened then it would be better to know about it than to keep wondering?"',
      '"Is there a reason you have decided that sitting somewhere else every day is preferable to sitting with the people you have sat with all year?"',
    ],
    tempt: '"Have you fallen out with one of us" tempts because it is the worry, said out loud. It also skips straight past the boring explanations — a club, a job, a different timetable — which are the ones most likely to be true.',
  },
  {
    scene: 'A teacher has marked you far more harshly than usual and you want to ask about it.',
    correct: '"Could you show me where this one lost the marks?"',
    wrong: [
      '"Why have you marked me down so heavily on this one?"',
      '"Have I done something to annoy you, because this is a long way off what I usually get for work of about the same standard?"',
      '"Is there a reason this piece has been marked to a completely different standard from the last three that I handed in?"',
    ],
    tempt: 'The last option tempts because it is polite and it contains a real observation. It also states the conclusion — that the standard changed — as though it were established, so the reply has to be a defence, and you learn nothing about the mark scheme.',
  },
  {
    scene: 'A friend has been slower to reply than usual for a couple of weeks.',
    correct: '"You have been quiet — is everything all right?"',
    wrong: [
      '"Why does it take you days to answer me these days?"',
      '"Are you annoyed with me about something, because the replies have got a lot shorter and I would rather just know either way?"',
      '"Is there a reason messages from me seem to end up at the bottom of the pile compared with everybody else\'s?"',
    ],
    tempt: 'The comparison in the last one tempts because it feels like evidence. You cannot see how fast they reply to anybody else, so the claim is an inference presented as a fact — and it is the part they will answer, instead of the question.',
  },
]

const attrAskable = tpl(
  {
    id: 'dd-attr-askable',
    name: 'The question that gets an answer',
    skillIds: ['h-attribution'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: ASK_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_CASES)
    return {
      title: 'Ask for the circumstance',
      prompt: `${c.scene}\n\nAll four are things people really say. Which one is a question they can actually answer?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Read each one and ask what replies are available. If the only options are agreeing with a verdict or denying it, no information can come back.',
        'A question that already contains an explanation is not a question. Look for the one that asks about circumstances instead.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Three of these have a character reading built into them — that they are careless, avoiding you, uninterested — and a reading built into a question cannot be disproved by an answer, only argued with. The open version costs the same breath and leaves the circumstance able to walk in: a shift pattern, a broken screen, a fortnight of illness, a teacher who put them on the spot.\n\n` +
        `This is worth doing even when you turn out to be right about the person. Asking the open question first costs you nothing if the answer is disappointing, and it is the only version that can surprise you.`,
    }
  },
)

const SHARED_CASES: Choice[] = [
  {
    scene: 'You moved the meeting to Thursday in a reply inside a long thread, and one member has not been in touch since.',
    correct: 'Send the new time to everyone as a separate message',
    wrong: [
      'Assume they saw it, since it was in the thread',
      'Ask the two people you sit with whether they knew about the change, because if they did then it was probably clear enough',
      'Say nothing, and mention it on Thursday',
    ],
    tempt: 'Checking with the two people you sit with tempts because it is a real check. They are the people most likely to have read the thread, so the answer you get back is about them and not about anybody who was busy that evening.',
  },
  {
    scene: 'You know the coach has been changed to the earlier one, because you were standing there when it was decided.',
    correct: 'Put the new departure time in the group chat today',
    wrong: [
      'Assume it will have gone round by itself',
      'Mention it to the two people who were also standing there, so that between you it will reach everybody who needs it',
      'Wait until somebody asks, since anybody who cares about getting there on time will check the details for themselves',
    ],
    tempt: '"Anyone who cares will check" tempts because it sounds like fairness. Nobody checks for a change they do not know has happened, so the rule quietly punishes people for not knowing the thing you are choosing not to tell them.',
  },
  {
    scene: 'You decided not to enter the competition after all, and you assumed your partner had worked that out.',
    correct: 'Tell them plainly that you are not entering',
    wrong: [
      'Assume it was obvious from you not practising',
      'Ask a mutual friend whether they think your partner has probably realised by now, so you do not have to make it awkward',
      'Leave it, and if it comes up nearer the date then explain that you had thought it was clear a long time ago',
    ],
    tempt: 'Reading your own non-practising as a signal tempts because it was obvious to you. It is only obvious if somebody is watching you and drawing the same conclusion, and they have their own week to think about.',
  },
  {
    scene: 'You are annoyed about how the jobs were shared out, and you think it must have been written on your face.',
    correct: 'Say that you are unhappy with how they were split',
    wrong: [
      'Assume they can tell, because it was obvious',
      'Ask somebody else at the meeting whether they thought you looked annoyed, so that you know whether it needs saying',
      'Wait and see whether it gets raised, because if anybody had noticed then they would surely have said something about it',
    ],
    tempt: 'Asking whether you looked annoyed tempts because it treats the question as answerable. Even a yes tells you only that one person read one face, and a decision about the rota is not going to be reopened because somebody thought you looked cross.',
  },
  {
    scene: 'You have read the rules and know the entry has to be mounted. Nobody else has mentioned mounting.',
    correct: 'Send the mounting rule to the others today',
    wrong: [
      'Assume everyone has read the same rules',
      'Ask the person who has entered before whether the mounting rule is well known, and take that as a sign about the rest',
      'Say nothing, since the rules are public',
    ],
    tempt: '"The rules are public" tempts because it is true and it feels fair. Public and read are different states, and you are the only person in the group who currently knows which one everybody else is in.',
  },
  {
    scene: 'You changed the shared document\'s layout on Sunday and everyone else was working in the old version.',
    correct: 'Tell the group what changed and where things moved',
    wrong: [
      'Assume they will notice when they open it',
      'Ask the person who edits it most whether they spotted the change, and take a yes as a sign that it was clear enough',
      'Leave it, and let anybody who has been working in the old version find out about it the next time they open the file up',
    ],
    tempt: 'The last option tempts because the change is visible and it is genuinely their file too. Visible is not the same as noticed, and the cost of the message is thirty seconds against somebody redoing an evening.',
  },
  {
    scene: 'You know why the trip was cancelled, because you were told directly. Others have only heard it is off.',
    correct: 'Tell them the reason, since you are the one who has it',
    wrong: [
      'Assume the reason went out with the cancellation',
      'Ask one other person whether they know why, and if they do then assume it must have reached everybody else as well',
      'Say nothing, because if it were something people were meant to know then somebody official would presumably have told them all about it',
    ],
    tempt: 'Waiting for somebody official tempts because it is not your announcement to make. You are the person holding a fact that stops a rumour, and a room without the reason will build one.',
  },
  {
    scene: 'You have decided you are dropping out of the fixture, and you told the coach a week ago.',
    correct: 'Tell the team as well, before the sheet goes up',
    wrong: [
      'Assume the coach will have passed it on',
      'Ask another player whether people seem to know, and take it as settled if they say they think so',
      'Leave it, because it will be obvious to everyone the moment the team sheet goes up on Thursday afternoon',
    ],
    tempt: '"The coach will have passed it on" tempts because that is genuinely their job. It might be true, and you are the only person who can be certain, which is exactly the position where a cheap message is worth more than an assumption.',
  },
  {
    scene: 'You know the club needs cash for the pitch fee, and you have assumed everyone knows to bring money.',
    correct: 'Message the amount and the reason for it before Saturday',
    wrong: [
      'Assume anyone who comes regularly knows about it',
      'Ask two of the regulars whether they were planning to bring money, and take a yes as a sign that everyone else will',
      'Say nothing, since the fee is unchanged',
    ],
    tempt: 'Asking two regulars is the strongest of the wrong options and it is the same error in miniature: you are sampling the people most like you, and the people who will turn up without cash are the ones you did not ask.',
  },
  {
    scene: 'You have already told one person you cannot make the weekend, and you feel as though the group knows.',
    correct: 'Say it in the group, so nobody plans around you being there',
    wrong: [
      'Assume it has been passed along by now',
      'Ask the person you told whether they mentioned it, and treat a probably as good enough for the rest of the group',
      'Leave it, since it will come up naturally at some point before the weekend and there is no need to make a thing of it',
    ],
    tempt: '"It will come up naturally" tempts because it usually does — after the numbers have been booked. The cost of being early is one message; the cost of being late is somebody paying for a place you were never going to use.',
  },
]

const projShared = tpl(
  {
    id: 'dd-proj-shared',
    name: 'They do not know what you know',
    skillIds: ['h-projection'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: SHARED_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, SHARED_CASES)
    return {
      title: 'Say it out loud',
      prompt: `${c.scene}\n\nWhat is the move?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what each person would have had to see or read to know this. Then ask whether you actually know that they did.',
        'Checking with the people closest to you does not test the assumption — they are the most likely to already know.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Once you know something it becomes very hard to picture not knowing it, so a fact you hold feels like a fact in the room. That is the same habit as assuming everyone shares your preferences, pointed at information rather than taste — and it has the same cheap repair, which is to say the thing out loud rather than to work out whether it needed saying.\n\n` +
        `Worth being honest about the status of this: the underlying pattern about preferences is well studied, and "assume they have not seen it, and send the message" is a rule of thumb rather than a measured result. It is recommended here because it costs thirty seconds and the failure it prevents costs somebody an evening.`,
    }
  },
)

const MY_INTEREST_CASES: (Choice & { position: string })[] = [
  {
    scene: 'You have told the group flatly that the meeting has to be on Tuesday.',
    position: 'the meeting must be on Tuesday',
    correct: 'You need to be home before your brother is dropped off',
    wrong: [
      'Tuesday is simply the best day for a meeting',
      'You would like the group to take your word for it',
      'You want the group to take your preferences as seriously as it takes everybody else\'s preferences',
    ],
    tempt: 'The first wrong option tempts because it is what you would say out loud. It is the demand again in slightly grander words — and a demand restated is exactly what stops a group finding the Wednesday morning that would also work.',
  },
  {
    scene: 'You have insisted that you are doing the whole presentation alone.',
    position: 'you will present alone',
    correct: 'You cannot face it going wrong in front of the class',
    wrong: [
      'Presenting alone always produces a better result',
      'You would prefer the group to recognise how much work you have already put into this project',
      'You want the marks for this to reflect the effort you personally put in rather than the group average',
    ],
    tempt: 'The marks explanation tempts because it is respectable and might be partly true. It also has an obvious answer — the teacher marks the group anyway — and answering it would leave the real thing untouched.',
  },
  {
    scene: 'You have told your parents you have to have your phone upstairs at night.',
    position: 'the phone stays upstairs',
    correct: 'You use it as an alarm and nothing else wakes you',
    wrong: [
      'It is your phone and you should decide where it lives',
      'You would like to be trusted in the way you think somebody of your age has probably earned by now',
      'You want the rule about the phone to be one that you had some say in rather than one handed down',
    ],
    tempt: '"It is mine and I should decide" tempts because it is the sentence with the most feeling in it. It is a position about authority, and it makes the conversation about who is in charge, which is the argument least likely to end with an alarm clock being bought.',
  },
  {
    scene: 'You have demanded that the trip happens on the second weekend, not the first.',
    position: 'it has to be the second weekend',
    correct: 'The first weekend is your grandmother\'s birthday',
    wrong: [
      'The second weekend is a better weekend for a trip',
      'You would like the group to remember that you were the one who organised this whole thing',
      'You want the date to be chosen by the people who are actually going rather than by whoever shouts first',
    ],
    tempt: 'The organiser claim tempts because it feels like something owed to you. It is a bid for status rather than a reason, and a group that says no to it has still not heard about the birthday.',
  },
  {
    scene: 'You have said you will not do the stall unless you get the Saturday morning slot.',
    position: 'you want the Saturday morning slot',
    correct: 'You have a shift every Saturday from one o\'clock',
    wrong: [
      'The morning slot is the best one on the rota',
      'You would like the worst slots recognised',
      'You want the rota to be built around what people actually need rather than around who asks first',
    ],
    tempt: 'The complaint about past terms tempts because it is fair and it is probably true. Fairness arguments settle who deserves what, and your shift settles what is possible — only one of them survives being checked.',
  },
  {
    scene: 'You have insisted the group project has to be a video.',
    position: 'it has to be a video',
    correct: 'You do not want to have to stand up and speak',
    wrong: [
      'A video is simply better than the alternatives',
      'You would like the group to try something more ambitious than it usually goes for with these',
      'You want the format decided on its merits rather than by whoever happens to have done it before',
    ],
    tempt: 'The ambition framing tempts because it is a nicer thing to want and it sounds like a reason. It also cannot explain why you would refuse a live performance that was more ambitious still.',
  },
  {
    scene: 'You have told your friend you are not going to the party, without saying why.',
    position: 'you are not going',
    correct: 'You do not want to be there without anyone you know',
    wrong: [
      'You simply do not like parties very much',
      'You would rather your friend accepted a no without needing a reason attached to it every time',
      'You want to be able to turn things down without it turning into a conversation about what is wrong',
    ],
    tempt: 'The second option is a completely legitimate position and it is not the interest underneath. Both can be true — you are entitled to refuse without explaining, and there is still a specific thing making this particular evening hard.',
  },
  {
    scene: 'You have said the money has to be spent on new nets rather than on shirts.',
    position: 'spend it on nets',
    correct: 'You are tired of the sessions stopping to fetch the ball',
    wrong: [
      'Nets are more useful to a club than shirts are',
      'You would like money spent on things that last',
      'You want the decision made by people who turn up every week rather than by the ones who come occasionally',
    ],
    tempt: 'The lasting-versus-looking-good framing tempts because it is a genuine principle and it sounds bigger than a ball in a hedge. Stated as a principle it invites a debate about values; stated as the ball, it invites somebody to suggest a backstop.',
  },
  {
    scene: 'You have refused to let the study session happen at your house again.',
    position: 'not at your house',
    correct: 'Your mum works nights and sleeps during the afternoon',
    wrong: [
      'Somebody else should be taking a turn hosting it',
      'You would like the group to notice that it has been at your house every single time since September',
      'You want hosting to be shared out properly rather than falling on whoever is easiest to ask each week',
    ],
    tempt: 'The fairness argument tempts because it is true and because it is easier to say than the real reason. It also invites a rota that puts your house back in it once a month, which does not help at all.',
  },
  {
    scene: 'You have insisted that you keep the controller for the next two hours.',
    position: 'two hours with the controller',
    correct: 'Your friends are only online until eight',
    wrong: [
      'You had it first, so the time should be yours',
      'You would like it recognised that you gave it up without complaining the last three times',
      'You want the time to be divided in a way that both of you agree to instead of settled by arguing',
    ],
    tempt: '"I had it first" tempts because it is the rule everybody grew up with, and rules like that end arguments without solving them. The eight o\'clock detail is the one that lets somebody else find a solution you did not think of.',
  },
]

const intMine = tpl(
  {
    id: 'dd-int-mine',
    name: 'What are you actually after?',
    skillIds: ['h-interests'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: MY_INTEREST_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, MY_INTEREST_CASES)
    return {
      title: 'Your own position, and your own need',
      prompt:
        `${c.scene}\n\nYour POSITION is clear: **${c.position}**. Underneath it is an INTEREST — the thing you actually need, which somebody might be able to meet another way.\n\nWhich one is the interest?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A position is what you are demanding. An interest is what would still be true if the demand were met a different way.',
        'Test each option: could somebody satisfy it WITHOUT giving you the thing you asked for? If not, it is the position again.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `Turning this on yourself is the version that is worth practising, because it is the one you can always do. A position has exactly one solution and somebody has to lose for you to get it; an interest usually has several, and naming yours is what lets the other person find one you had not thought of. It also costs something real to say out loud — "I do not want it going wrong in front of the class" is harder to say than "I am doing it alone" — which is why most arguments stay at the level of positions.\n\n` +
        `The honest caveat: saying what you need is not the same as getting it. Sometimes the answer is still no, and you will have said the true thing for nothing. That is the price, and it is usually smaller than the alternative, which is an argument nobody can solve.`,
    }
  },
)

const CHANGE_CASES: Choice[] = [
  {
    scene: 'A week ago you apologised for repeating something a friend told you privately.',
    correct: 'She mentions something in confidence, and it goes no further',
    wrong: [
      'You apologise again the next time you see her',
      'You buy her something at the weekend and tell her it is because you still feel bad about what happened',
      'You tell two other people how sorry you are',
    ],
    tempt: 'Apologising again tempts because it feels like taking it seriously. It puts the work back on her — she now has to reassure you — and it uses up the one chance the week offered to show anything.',
  },
  {
    scene: 'A week ago you apologised for missing your slot on the stall rota.',
    correct: 'You turn up early for the next one and stay to the end',
    wrong: [
      'You bring it up again at the stall and say sorry properly',
      'You explain to the rest of the committee exactly what happened that day, so that everyone understands it was not carelessness',
      'You offer to do somebody else\'s shift in a fortnight, and mention it several times before the fortnight is up',
    ],
    tempt: 'Explaining to the committee tempts because being understood feels like part of repair. It is about your reputation rather than about the shift, and the person who stood alone for two hours is not in that conversation.',
  },
  {
    scene: 'A week ago you apologised for a joke about a classmate that the room laughed at.',
    correct: 'You say nothing like it again, including when it would land',
    wrong: [
      'You tell him again that you did not mean it',
      'You make a point of being especially friendly to him in front of the same group for the next few days',
      'You explain to the people who laughed that it came out worse than you had intended it to at the time',
    ],
    tempt: 'Being conspicuously friendly in front of the same group tempts because it looks like making amends publicly. It performs the repair for the audience that watched the injury, which is a second thing done in front of people rather than a change.',
  },
  {
    scene: 'A week ago you apologised for changing the group\'s plan without telling one member.',
    correct: 'The next change goes to her first, before anyone else hears it',
    wrong: [
      'You say sorry about it once more at the meeting',
      'You explain in the group chat that the change had to be made quickly and there had not really been time to consult anybody',
      'You ask her whether she is still upset about it, and then again a few days later when she says that she is not',
    ],
    tempt: 'Asking whether she is still upset tempts because it sounds like caring. Asked twice it becomes a request to be released, and it makes her responsible for closing something you opened.',
  },
  {
    scene: 'A week ago you apologised for losing a book you had borrowed.',
    correct: 'You replace it without being asked and hand it over',
    wrong: [
      'You say sorry about it again the next time that you meet',
      'You explain in detail where you think it went, so that it is clear you did not simply throw it in a bag and forget it',
      'You offer to lend her anything of yours whenever she wants, and mention the offer again a couple of times that week',
    ],
    tempt: 'The open offer tempts because it is generous in principle. A vague future favour costs nothing today and asks her to accept an IOU in place of the book, which is the one thing that would actually settle it.',
  },
  {
    scene: 'A week ago you apologised for being late three times in a row.',
    correct: 'You are there before the time on the next two arrangements',
    wrong: [
      'You apologise for the lateness once more',
      'You explain that the bus times changed this term and that is what was behind all three of the occasions',
      'You message an hour before, promising to be on time',
    ],
    tempt: 'The bus explanation tempts because it may well be true, and true explanations arrive at the wrong moment. A reason offered a week later reads as a defence of the past rather than a plan for the future.',
  },
  {
    scene: 'A week ago you apologised for reading a message over somebody\'s shoulder.',
    correct: 'You look away without being asked when a phone comes out',
    wrong: [
      'You promise again that you will not do it any more',
      'You explain that you had only seen a couple of words and had not really taken in what any of it was about',
      'You mention it a few times as a joke about yourself, so that it is clearly out in the open between you',
    ],
    tempt: 'Turning it into a running joke tempts because it feels like the friendly way to keep it small. It also decides on their behalf that it is small, and it puts them in the position of laughing about something they minded.',
  },
  {
    scene: 'A week ago you apologised for letting somebody else take the blame for something you did.',
    correct: 'You tell the teacher what happened, without being pushed to',
    wrong: [
      'You apologise to him again, and much more thoroughly this time',
      'You explain that you had frozen at the time and had not planned for it to go the way that it ended up going',
      'You offer to help him with the work he missed, and tell him that you will do it whenever he wants to ask',
    ],
    tempt: 'Explaining the freezing tempts because it is honest and it is probably accurate. It also asks him to hold your discomfort while the record still has his name on it, and the record is the thing within your power to change.',
  },
  {
    scene: 'A week ago you apologised for going ahead with a plan after somebody said they could not make it.',
    correct: 'You check the date with her before the next one is fixed',
    wrong: [
      'You say sorry about the last one once again',
      'You explain that most of the group could do that day and it seemed easier than trying to find another one everybody could do',
      'You tell her to speak up sooner next time',
    ],
    tempt: 'Telling her to speak up next time tempts because it sounds like a fix. She did say something, which is how you knew — so the instruction moves the responsibility onto the person who already did the thing you are asking for.',
  },
  {
    scene: 'A week ago you apologised for snapping at your brother in front of his friend.',
    correct: 'The next time you are annoyed you take it up in private',
    wrong: [
      'You tell him again that you should not have said it',
      'You explain that you had had a bad week and it had very little to do with him or with anything he had actually done',
      'You are unusually nice to him for a few days, and then things go back to exactly how they were before it happened',
    ],
    tempt: 'A few days of being unusually nice tempts because it feels like making up for it, and it is the most common shape a non-repair takes. It is a mood, it expires, and everybody involved can feel the moment it does.',
  },
]

const repChange = tpl(
  {
    id: 'dd-rep-change',
    name: 'A week later, what shows it was real?',
    skillIds: ['h-repair'],
    bucket: INSIGHT,
    difficulty: 3,
    variants: CHANGE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CHANGE_CASES)
    return {
      title: 'The part that is not words',
      prompt: `${c.scene} The words were right at the time.\n\nWhich of these actually shows the apology meant something?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look for the option that costs you something at the next opportunity, rather than the one that says something now.',
        'Watch for anything that asks the other person to do work — to reassure you, to forgive you, or to be seen accepting it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}**. ${c.tempt}\n\n` +
        `An apology is a promise about behaviour, and the week after it is where the promise is either kept or is not. Research on written apologies finds that the components people rate highest are taking responsibility and offering repair, and the one they rate lowest is asking to be forgiven — which lines up with what the wrong options here have in common: they put the work back on the person who was hurt.\n\n` +
        `Two honest limits. That research asked people to rate written apologies in scenarios, so it is evidence about what reads as a real apology, not proof that any relationship recovered. And the timing is not yours to set: the person who was hurt decides when it is finished, and an apology is owed rather than deployed — doing the changed thing quietly, with no receipt asked for, is the whole of your side of it.`,
    }
  },
)

export const DECISIONS_DEPTH_TEMPLATES: ItemTemplate[] = [
  backwardOrder,
  blockedStep,
  justBefore,
  runway,
  estLedger,
  estScored,
  estRange,
  estOutside,
  preModes,
  preFix,
  preClaim,
  ethDaylight,
  ethAgency,
  ethSpend,
  evBranches,
  evEntry,
  evNeed,
  evRepeat,
  dealBreaker,
  revWindow,
  displaced,
  sunkSwitch,
  emoName,
  emoTwoReadings,
  emoDecider,
  emoThreeWays,
  infCount,
  infSort,
  infDark,
  infClock,
  infRefuse,
  bndOwnAction,
  bndCool,
  bndHeat,
  bndAgain,
  bndEscalate,
  attrAskable,
  projShared,
  intMine,
  repChange,
]
