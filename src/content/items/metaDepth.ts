/**
 * Meta Depth — depth for the ten Meta Lab skills that already exist.
 *
 * Meta Lab was the thinnest area in the app: 21 topics carrying 41 question
 * families, about 2.0 per topic against ~4.7 for mathematics, with `x-stuck`
 * and `x-interleave` never reached at all in a simulated learner-year and
 * three more topics receiving under a minute. Nothing here adds a skill. Every
 * template deepens one that was already declared, and the weighting follows
 * the starvation: five new families each for `x-stuck`, `x-method`, `x-focus`,
 * `x-calib` and `x-learn`, four each for `x-interleave`, `x-desirable`,
 * `x-transfer`, `x-compare` and `x-explain`.
 *
 * FORMAT SPREAD IS DELIBERATE. The pre-existing Meta Lab bank was almost
 * entirely four-option multiple choice, which trains recognition of a phrasing
 * as much as the idea. This file uses `classify` for sorting behaviours and
 * error causes, `multi` for "select every one that applies", `order` for
 * sequencing, and `numeric` wherever the thing is genuinely computable
 * (spacing intervals, minutes in a block, a hit rate against a stated
 * confidence). Roughly two fifths of the families here are not MCQs.
 *
 * EVIDENCE POSITION, stated once and honoured in every explanation below.
 *
 *  - **Retrieval practice** and **distributed practice (spacing)** are the two
 *    highest-utility techniques in Dunlosky et al. (2013, *PSPI* 14(1)); the
 *    IES practice guide (Pashler et al. 2007) leads with spacing. Rereading and
 *    highlighting rate low in the same review. The **fluency illusion** — ease
 *    of processing read as evidence of learning — is the mechanism that keeps
 *    the low-utility techniques popular, and it is well documented.
 *  - **Interleaving is CONDITIONAL and the copy says so.** Rohrer, Dedrick &
 *    Burgess (2014) is the strongest classroom result (delayed mixed test 72%
 *    vs 38%), but the pooled effect is g = 0.29 after trim-and-fill with
 *    I² = 77.3% (RESEARCH.md §3), and Sorensen & Woltz (2016) found BLOCKED
 *    exposure better while a category is still being formed. Three of the eight
 *    schedule cases in `md-il-blocked-wins` therefore have "blocked" as the key,
 *    and one distractor in those cases is the overgeneralisation itself. An
 *    item bank whose answer is always "interleave" would be teaching a slogan.
 *  - **Productive struggle**: what is supported is that ATTEMPTING before being
 *    taught beats the reverse order (Sinha & Kapur 2021, 53 studies, g = 0.36).
 *    Nothing here says struggling as such is good for you. The `x-stuck`
 *    families teach a discrimination — did the last few attempts produce any
 *    new information — and what each state asks you to do next.
 *  - **Case comparison** is the transfer mechanism with the best controlled
 *    evidence: Gentner, Loewenstein & Thompson (2003, *J. Educ. Psych.* 95(2)),
 *    .59 vs .22 transfer to a new case against studying the same two cases
 *    separately, with an active control. What it licenses is a structurally
 *    similar new case at delays up to about a week. Nothing more.
 *  - **Explicitly REFUSED, and named as refused inside the content**: learning
 *    styles, brain training, memory-athlete claims, and any suggestion that
 *    this work raises general ability. Owen et al. (2010, *Nature* 465,
 *    N = 11,430); Simons et al. (2016, *PSPI* 17(3)); Melby-Lervåg, Redick &
 *    Hulme (2016, *PPS* 11(4)); Sala & Gobet (2017). `md-le-not-supported` and
 *    `md-le-tier-sort` exist to make refusing a plausible claim a gradeable
 *    skill, because recognising the myths is part of study science.
 *  - Where a routine is plausible but untested — the escalation ladder for
 *    asking for help, the shape of a work block — the explanation says so in
 *    plain words rather than borrowing authority from an unrelated finding.
 *
 * OPTION-LENGTH DISCIPLINE. The app shipped and fixed a bug where the correct
 * option was systematically the longest and a learner scored 62% in one bucket
 * by picking the long one. Every MCQ here was measured: in no option set is the
 * key strictly the longest, and the key's length RANK is spread across each
 * template's variants rather than parked in one place. Decoys were lengthened
 * to achieve that; the key was never shortened to fake it.
 */
import type { AnswerSpec, ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, multi, numeric, tpl } from '../lib'
import { shuffle, type Rng } from '../../engine/rng'

/** Ordering answer whose key is COMPUTED from the shuffled display order. */
function ordered(rng: Rng, correctOrder: readonly string[]): Extract<AnswerSpec, { type: 'order' }> {
  const options = shuffle(rng, [...correctOrder])
  return { type: 'order', options, correct: correctOrder.map((s) => options.indexOf(s)) }
}

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

// =====================================================================
// x-stuck — telling productive struggle from being genuinely stuck
// =====================================================================

/**
 * The discrimination the skill rests on, as a SORT rather than a choice.
 * Both states feel unpleasant, so the feeling cannot be the cue; the cue is
 * whether the last few minutes produced anything that was not there before.
 * Sorting eight concrete moves is harder to answer by phrasing than picking
 * one of four sentences, which is why this is the entry point.
 */
interface SignalCase {
  scene: string
  /** Attempts that produced something that was not there before. */
  moving: string[]
  /** Attempts that left you knowing exactly what you knew. */
  repeating: string[]
  why: string
}

const SIGNAL_CASES: SignalCase[] = [
  {
    scene: 'Twelve minutes into a geometry problem with a circle and two chords.',
    moving: [
      'You drew the radius to one chord and found a right angle you had not marked',
      'You tried a similar-triangles route and it failed because no angle is shared',
      'You wrote down that the two chords are not equal, which rules out one approach',
      'You measured nothing but noticed the diagram never says the centre is marked',
    ],
    repeating: [
      'You redrew the same diagram slightly larger and looked at it again',
      'You reread the question for the fifth time without writing anything down',
      'You tried the same angle-sum move again in case it works this time round',
      'You listed the same three facts you had already listed on the line above',
    ],
    why: 'A closed route is information. A redrawn diagram is not.',
  },
  {
    scene: 'Twenty minutes into an essay paragraph that will not start.',
    moving: [
      'You wrote a bad first sentence and saw immediately what was wrong with it',
      'You worked out that the paragraph is arguing two separate things at once',
      'You found the quotation you needed and it says less than you remembered',
      'You tried leading with the evidence and it made the claim sound unearned',
    ],
    repeating: [
      'You reworded the opening clause for the sixth time and deleted it again',
      'You reread the essay question and then reread your own plan of it',
      'You opened the document, looked at the blank paragraph, and closed it',
      'You changed the font size and then changed the font size back again',
    ],
    why: 'Writing a bad sentence tells you something. Rewording the same clause does not.',
  },
  {
    scene: 'Half an hour on a program that prints the wrong total.',
    moving: [
      'You printed the running total inside the loop and it is already wrong at step two',
      'You checked the input file and the numbers in it are exactly what you expected',
      'You commented out the discount line and the total changed, so it is involved',
      'You tried a list of one item and got the right answer, which narrows it a lot',
    ],
    repeating: [
      'You ran the program again unchanged to see whether it does the same thing',
      'You reread the same twelve lines slowly, from the top, for the fourth time',
      'You retyped the same line with the same logic and slightly different spacing',
      'You restarted the editor in case something about it had gone wrong somehow',
    ],
    why: 'Halving the space the bug can be in is progress. Re-running it unchanged is not.',
  },
  {
    scene: 'Fifteen minutes on a physics question about a block on a slope.',
    moving: [
      'You drew the forces and realised you had left friction off the diagram',
      'You resolved along the slope instead of horizontally and the numbers got simpler',
      'You tried energy instead of forces and found you do not have the distance',
      'You checked units and found your answer would come out in the wrong ones',
    ],
    repeating: [
      'You wrote F equals m a again at the top of a clean sheet of paper',
      'You reread the question hoping a number you missed will turn up in it',
      'You tried the same substitution once more, more carefully than last time',
      'You copied the diagram out again neatly with the same labels on it',
    ],
    why: 'Finding out which quantity you have not been given is a real result.',
  },
  {
    scene: 'Twenty-five minutes trying to balance a chemical equation that will not balance.',
    moving: [
      'You counted the oxygen atoms and they are odd on one side and even on the other',
      'You tried doubling the whole equation and the odd count became an even one',
      'You checked the formula for the product and found you had written it wrong',
      'You started from the most complicated compound instead of the simplest one',
    ],
    repeating: [
      'You tried the same set of coefficients again in a slightly different order',
      'You recounted the same three elements you have already counted twice',
      'You wrote the equation out again neatly with the arrow in the middle',
      'You looked at the worked example on the page and then looked away again',
    ],
    why: 'Discovering the formula was written wrong ends the problem. Recounting does not.',
  },
  {
    scene: 'Forty minutes on a guitar bar that keeps collapsing.',
    moving: [
      'You slowed it down and found the collapse happens on the change, not the chord',
      'You tried a different fingering and it failed in a completely different place',
      'You recorded yourself and heard that the first note is late rather than wrong',
      'You played it without the strum and the left hand alone is already struggling',
    ],
    repeating: [
      'You played the same bar at the same speed for the twelfth time running',
      'You tuned the guitar again, having tuned it four minutes previously',
      'You restarted the piece from the beginning to reach the same bar again',
      'You watched the same two seconds of the tutorial video for the fifth time',
    ],
    why: 'Locating the failure inside the bar is progress. Repeating the bar is not.',
  },
]

const stuckSortSignals = tpl(
  {
    id: 'md-stuck-sort-signals',
    name: 'Did that produce anything?',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 2,
    variants: SIGNAL_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, SIGNAL_CASES)
    return {
      title: 'Moving, or going round',
      prompt: `**Where you are.** ${c.scene}\n\nSort each of the last few things you did. One question decides each one: did it leave you knowing something you did not know before? Ruling a route OUT counts as knowing something.`,
      answer: classify(
        rng,
        ['Produced something new', 'Left you exactly where you were'],
        [
          ...c.moving.map((text) => ({ text, category: 0 })),
          ...c.repeating.map((text) => ({ text, category: 1 })),
        ],
      ),
      hints: [
        'Do not ask whether it worked. Ask whether it told you anything, including "that route is closed".',
        'Neatening, rereading, restarting and retyping almost never produce new information.',
        `The rule this case turns on: ${c.why}`,
      ],
      explanation: `**Produced something new:** ${c.moving.join('; ')}. Every one of those changes what you would write down about the problem, and a closed route is as real a finding as an open one.\n\n**Left you where you were:** ${c.repeating.join('; ')}. ${c.why}\n\nThe reason this matters: both states feel bad, so the feeling cannot be the signal. Elapsed time cannot be the signal either — twelve minutes of narrowing is fine and two minutes of repeating is not. Information gained is the only cue that separates them, and it is the one you can actually check.`,
      transferBridge:
        'The same read works on a stuck argument, a stuck plan or a stuck conversation: have the last three exchanges told anyone anything new, or has the same point come round again?',
    }
  },
)

/**
 * The second unproductive repetition, located precisely. Being able to say
 * "it was attempt four" is a sharper skill than agreeing that repetition is
 * bad, and the answer is computed from the log rather than typed.
 */
interface LogCase {
  scene: string
  /** [what the attempt did, whether it produced anything new] */
  log: [string, boolean][]
  why: string
}

const LOG_CASES: LogCase[] = [
  {
    scene: 'A trigonometry problem, logged attempt by attempt.',
    log: [
      ['Drew the triangle and labelled the two known sides.', true],
      ['Tried the sine rule; it needs an angle you do not have.', true],
      ['Tried the sine rule again with the sides swapped round.', false],
      ['Wrote the sine rule out once more, more neatly.', false],
      ['Tried the cosine rule; it uses all three sides, which you have.', true],
    ],
    why: 'Attempt 2 closed a route, which is information. Attempts 3 and 4 are the same move twice.',
  },
  {
    scene: 'A history paragraph, logged attempt by attempt.',
    log: [
      ['Wrote a topic sentence naming two causes at once.', true],
      ['Noticed the paragraph cannot argue both causes and split them.', true],
      ['Reread the plan without changing anything in it.', false],
      ['Reread the essay question without changing anything.', false],
      ['Wrote the first cause on its own and it took four lines.', true],
    ],
    why: 'Attempts 3 and 4 are both rereading with nothing written down, and 4 is the second in a row.',
  },
  {
    scene: 'A program returning the wrong average, logged attempt by attempt.',
    log: [
      ['Ran it on the real file; the answer is far too small.', true],
      ['Ran it again on the same file to check it repeats.', false],
      ['Ran it a third time, watching the output more closely.', false],
      ['Printed the count and it is one larger than the list.', true],
      ['Found the loop adds an extra step past the end.', true],
    ],
    why: 'Re-running unchanged code cannot produce new information, and attempt 3 is the second such run.',
  },
  {
    scene: 'A stoichiometry question, logged attempt by attempt.',
    log: [
      ['Converted the mass to moles using the formula mass.', true],
      ['Used the ratio from the equation and got a strange number.', true],
      ['Checked the ratio in the equation; it is written correctly.', true],
      ['Redid the same division with the same two numbers.', false],
      ['Redid it once more on the calculator to be certain.', false],
      ['Checked the formula mass and found it was wrong from the start.', true],
    ],
    why: 'Attempts 4 and 5 are the same division twice; the error was upstream of it the whole time.',
  },
  {
    scene: 'A geometry proof, logged attempt by attempt.',
    log: [
      ['Marked the given angles and the one to be proved.', true],
      ['Tried congruent triangles; no pair shares enough information.', true],
      ['Tried congruent triangles again from the other vertex.', false],
      ['Tried congruent triangles a third time, drawn larger.', false],
      ['Tried the parallel-line angle facts and two angles matched.', true],
    ],
    why: 'One failed congruence attempt is a closed route; the second and third add nothing to it.',
  },
  {
    scene: 'A French translation, logged attempt by attempt.',
    log: [
      ['Translated word by word; the sentence came out ungrammatical.', true],
      ['Found the verb is reflexive, which changes the pronoun.', true],
      ['Rewrote the same sentence with the same structure again.', false],
      ['Rewrote it once more with the words in the same order.', false],
      ['Looked up the tense and found it is not the one you used.', true],
    ],
    why: 'Attempts 3 and 4 keep the structure that was already shown not to work.',
  },
  {
    scene: 'A circuit question, logged attempt by attempt.',
    log: [
      ['Redrew the circuit as two resistors in series.', true],
      ['Realised one branch bypasses the second resistor entirely.', true],
      ['Redrew it as series anyway to see what happens.', false],
      ['Redrew the series version once more, more carefully.', false],
      ['Redrew it as a parallel pair and the numbers behaved.', true],
    ],
    why: 'Once the series reading was ruled out, drawing it twice more could not add anything.',
  },
  {
    scene: 'A basketball free throw, logged attempt by attempt.',
    log: [
      ['Ten shots; eight missed short and to the left.', true],
      ['Filmed one and the elbow drifts out on the way up.', true],
      ['Took ten more shots exactly as before.', false],
      ['Took ten more again without changing anything.', false],
      ['Held the elbow in deliberately and six of ten dropped.', true],
    ],
    why: 'Repeating an unchanged action is the physical version of re-running unchanged code.',
  },
]

const stuckSecondRepeat = tpl(
  {
    id: 'md-stuck-second-repeat',
    name: 'Find the second repetition',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 3,
    variants: LOG_CASES.length,
    minutes: 3,
  },
  (_rng, seed) => {
    const c = cycle(seed, LOG_CASES)
    let answer = c.log.length
    for (let i = 1; i < c.log.length; i++) {
      if (!c.log[i][1] && !c.log[i - 1][1]) {
        answer = i + 1
        break
      }
    }
    const listed = c.log.map(([text], i) => `**${i + 1}.** ${text}`).join('\n')
    return {
      title: 'The moment to stop',
      prompt: `${c.scene}\n\n${listed}\n\nGoing down the list, find the first attempt that produced nothing new **and** came straight after another attempt that produced nothing new. Give its number.`,
      answer: numeric(answer),
      hints: [
        'Go through the list once and mark each attempt yes or no: did it leave you knowing something you did not know before?',
        'Closing off a route counts as yes. Repeating, rereading, redrawing and re-running unchanged all count as no.',
        `Two "no" attempts in a row is the signal, and you want the number of the second one. Here that is attempt ${answer}.`,
      ],
      explanation: `Attempt ${answer}. ${c.why}\n\nOne unproductive attempt means very little — anything can fail once. The second one in a row is the honest signal, because it says the ideas have run out rather than that this idea did not work. That is the moment a hint or a smaller question is worth the most, and the moment before it is the point where most of the wasted time in a study session gets spent.`,
      transferBridge:
        'Keep the same one-line log outside study. Two consecutive entries that say nothing new is the cheapest stopping rule there is.',
    }
  },
)

/**
 * The smallest ask. Help-seeking has two failure modes, avoidance and
 * over-reliance, and the middle move is the one nobody teaches: name where you
 * got to, name what is blocking you, ask for the next step only.
 */
interface AskCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const ASK_CASES: AskCase[] = [
  {
    scene:
      'You can set up the equation for a word problem but cannot see how to get the second unknown out of it. A friend has finished and is packing up.',
    key: '"Here is my equation — what is the next line?"',
    decoys: [
      'Ask them to work the whole problem through with you from the very beginning',
      'Ask to photograph their page so you can compare every line against your own',
      'Say nothing, keep going alone, and hand in whatever you have at the end of it',
      'Ask them which questions on the sheet they found the hardest ones overall',
    ],
    why: 'The next line is the smallest thing that unblocks you and leaves the rest of the problem yours. A full walkthrough removes exactly the part that would have taught you something, and comparing whole pages tells you where you differ without telling you why.',
  },
  {
    scene:
      'You are stuck on a chemistry calculation and the teacher is walking round the room with about a minute per student.',
    key: '"I got to moles of the acid and stopped. What does that number feed into?"',
    decoys: [
      'Ask them to explain the whole topic again because none of it is going in',
      'Ask whether this kind of question is likely to come up in the exam paper',
      'Ask them to check every line of your working from the start to the end',
      'Ask what mark you would get for the working you have written down so far',
    ],
    why: 'A precise blocker gets a precise answer inside the minute you actually have. "Explain the whole topic" spends the minute on the ninety per cent you already had, and asking about the exam swaps a learning question for a reassurance one.',
  },
  {
    scene: 'A hint ladder is open in front of you and you have read the first hint without trying anything since.',
    key: 'Close it and try again before opening the second hint',
    decoys: [
      'Open all of the remaining hints so that you can see the whole picture at once',
      'Refuse every hint from here on, since a hinted answer does not really count',
      'Open the last hint first, because that is the one that contains the actual method',
      'Leave the item and come back to it when you feel more awake about it later',
    ],
    why: 'A hint you have not acted on has not been used yet. Opening the rest converts the problem into a worked example you are reading, and refusing hints entirely is the other failure mode — an hour stuck teaches less than one hint plus a real attempt, and the app records a hinted success honestly as guided rather than independent.',
  },
  {
    scene:
      'Two different approaches to the same word problem have both broken on the same detail — you cannot tell which quantity the percentage is being taken of.',
    key: '"Both my routes died on the same thing: what is the percentage taken of here?"',
    decoys: [
      'Ask for a full worked solution, since two failed attempts means you have earned one',
      'Ask whether there is a completely different third method you have not tried yet',
      'Ask for the answer so that you can work backwards from it to the method',
      'Start again from a blank page and hope the third attempt goes differently',
    ],
    why: 'Two routes failing at the same point identifies the blocker exactly, which is the most valuable question you will ever get to ask. Asking for a third method or a worked solution throws that precision away and buys back a general explanation you do not need.',
  },
  {
    scene:
      'You are stuck at home with nobody to ask, fifteen minutes past the last thing you learned, and three more questions to do.',
    key: 'Write down exactly what is blocking you, move on, and come back',
    decoys: [
      'Keep going on this one until it cracks, because stopping now would be giving up',
      'Look up the full worked answer and read it through carefully a couple of times',
      'Abandon the whole set for tonight, since the block has clearly beaten you today',
      'Search for a video about the topic and watch it from the beginning to the end',
    ],
    why: 'The written blocker is what makes coming back cheap; without it you restart from nothing. Reading a worked answer you have not earned produces recognition rather than the ability to do it, and grinding past the point where new information stopped arriving is the least productive time in any session.',
  },
  {
    scene:
      'You do not understand what the question is asking, and you have not written anything down yet.',
    key: 'List what you are given and what is wanted, in your own words',
    decoys: [
      'Ask for a hint about the method, since a hint is what you get when you are stuck',
      'Read the question again slowly, several times over, until it starts to make sense',
      'Skip it and come back at the end, when the other questions have warmed you up',
      'Look for a worked example on the page that has roughly the same shape as it',
    ],
    why: 'Not-understanding-the-question is its own problem, and a hint about the METHOD does not touch it — you would get a hint about how to do something you cannot yet state. Rereading is the move that most reliably produces nothing; writing the givens down forces the words into quantities.',
  },
  {
    scene:
      'You solved it, but only after three hints, and the app has recorded the attempt as guided rather than independent.',
    key: 'That is the point — it books the same idea to come back unaided',
    decoys: [
      'Unfair, given that you did reach the correct answer in the end by yourself',
      'A reason to stop using hints, so that the record looks better than it did',
      'Meaningless, because taking any hint at all makes the whole attempt worthless',
      'A sign the problem was too hard and should not have been offered to you',
    ],
    why: 'The label is doing you a favour rather than judging you: it is what schedules the idea to return with no help, which is the only way to find out whether it is yours. Avoiding hints to protect the record optimises a scoreboard, and this app has no scoreboard to protect.',
  },
  {
    scene:
      'You have asked for help and the person is about to start explaining. You have one sentence to aim them.',
    key: '"I can get as far as this line, and here is what I cannot get past."',
    decoys: [
      '"I do not really understand any of this topic, if I am completely honest."',
      '"Could you show me how to do this whole kind of question, from the start?"',
      '"I think I am probably just bad at this particular part of the subject."',
      '"Is what I have written down here right so far, do you think, or not?"',
    ],
    why: 'Naming where you stopped is most of the diagnostic work, and doing it out loud is often when people unstick themselves. The vague versions make the helper re-teach from the beginning, which spends their time on the part you already had, and "I am bad at this" replaces a fixable blocker with a verdict.',
  },
]

const stuckSmallestAsk = tpl(
  {
    id: 'md-stuck-smallest-ask',
    name: 'Ask for the smallest thing',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 3,
    variants: ASK_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_CASES)
    return {
      title: 'The smallest unblocking amount',
      prompt: `${c.scene}\n\nWhat is the best move?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'There are two ways to get this wrong: taking more help than you need, and taking none at all.',
        'Aim for the smallest thing that gets you moving again, and keep the rest of the problem yours.',
        'A good ask names where you got to and what is blocking you. A bad one asks for the whole thing or asks nothing.',
      ],
      explanation: `${c.key}. ${c.why}\n\nHelp-seeking has two failure modes rather than one, and almost all advice warns about only the first. Warning about over-reliance alone quietly teaches the other one: sitting stuck for an hour and calling it effort.`,
      transferBridge:
        'The shape works everywhere: "here is where I got to, here is what is blocking me" gets a useful answer from a teacher, a teammate, a forum or a search box — and often answers itself while you type it.',
    }
  },
)

/**
 * Multi-select, because "which of these means stuck" has several true answers
 * and a single-choice version would let one recognisable phrase carry it. The
 * incorrect options are all things that feel like being stuck and are not.
 */
interface StuckSignalSet {
  scene: string
  correct: string[]
  incorrect: string[]
  why: string
}

const STUCK_SIGNAL_SETS: StuckSignalSet[] = [
  {
    scene: 'Halfway through a maths problem set.',
    correct: [
      'The last two attempts were the same move with different handwriting',
      'You cannot say what you would try next if someone asked you right now',
    ],
    incorrect: [
      'It has taken longer than you expected it to take when you started',
      'You have already got two of the earlier questions on the sheet wrong',
      'The problem feels much harder than the worked example did in the lesson',
      'You are irritated with the question and would rather be doing something else',
    ],
    why: 'The two signals are about information and about having a next move. Time, mood, difficulty and earlier mistakes are all things you notice while stuck and none of them distinguishes stuck from working.',
  },
  {
    scene: 'Debugging a program that produces the wrong output.',
    correct: [
      'The last three runs were identical and so were their outputs',
      'You are changing things to see what happens rather than to test anything',
    ],
    incorrect: [
      'The program is longer than anything you have written before this one',
      'You have been at it for well over the time you set aside for it tonight',
      'The error message uses several words you have not looked up yet',
      'You would rather ask someone than carry on reading the code again',
    ],
    why: 'Random changes and identical re-runs both mean the search has stopped narrowing. Length, elapsed time and unfamiliar vocabulary are conditions of the task, not readings of your state — and an unlooked-up error message is a next move sitting right there.',
  },
  {
    scene: 'Writing the conclusion of an essay.',
    correct: [
      'Every sentence you write is a reworded version of the one before it',
      'You could not say what the conclusion is supposed to add if asked',
    ],
    incorrect: [
      'The paragraph is coming out shorter than the ones above it are',
      'You are tired, and it is later in the evening than you meant it to be',
      'You do not like the essay very much now that you have read it back',
      'Your first attempt at the conclusion had to be deleted completely',
    ],
    why: 'Rewording in place and not knowing what the paragraph is for are both "no next move". A deleted first attempt is the opposite: it told you something. Tiredness is real and worth acting on, but it is a reason to stop, not evidence about the problem.',
  },
  {
    scene: 'Practising a difficult passage on an instrument.',
    correct: [
      'You have played it the same way at the same speed a dozen times running',
      'You cannot say which part of the passage is actually failing',
    ],
    incorrect: [
      'It still sounds worse than the recording you have been listening to',
      'Your hand aches, and you have been going for longer than usual tonight',
      'You have not managed a clean run of the whole passage yet this evening',
      'The fingering in the book is not the one your teacher gave you for it',
    ],
    why: 'Unchanged repetition and not being able to locate the failure are the two signals. Sounding worse than a recording is the normal state of practice; an aching hand is a reason to stop for physical reasons; a fingering disagreement is a specific question you could ask.',
  },
  {
    scene: 'Working through a physics question in a timed test.',
    correct: [
      'You have written and crossed out the same first line three times',
      'Nothing you have tried in the last four minutes changed what you know',
    ],
    incorrect: [
      'This is the last question and you have eleven minutes left on the clock',
      'The question carries more marks than any other question on the paper',
      'You cannot remember whether you revised this topic properly or not',
      'The diagram is drawn in a way you have not seen used before today',
    ],
    why: 'The two real signals are about repetition and information. Marks, clock, and whether you revised are facts about the exam; an unfamiliar diagram is a thing to describe to yourself, which is a move you have not made yet.',
  },
  {
    scene: 'Reading a dense paragraph in a textbook.',
    correct: [
      'You have read the same paragraph four times and can summarise none of it',
      'You cannot name the specific word or step that is stopping you',
    ],
    incorrect: [
      'The paragraph contains three terms that were defined earlier in the chapter',
      'It is taking much longer per page than the previous section did',
      'You disagree with the way the author has chosen to explain it',
      'The chapter is one your teacher said was the hardest in the book',
    ],
    why: 'Four passes with no summary is repetition without information, and not being able to name the blocker is the absence of a next move. Terms defined earlier are a route — go back and get them. Slow going and a warning about difficulty are expectations, not readings.',
  },
]

const stuckWhichSignals = tpl(
  {
    id: 'md-stuck-which-signals',
    name: 'Which of these actually means stuck?',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 3,
    variants: STUCK_SIGNAL_SETS.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, STUCK_SIGNAL_SETS)
    return {
      title: 'Signals and scenery',
      prompt: `**Where you are.** ${c.scene}\n\nSelect every statement below that is genuine evidence you are stuck rather than working. Several are true of the situation and are still not evidence.`,
      answer: multi(rng, [...c.correct], [...c.incorrect]),
      hints: [
        'Two things count as evidence: the same move coming round again, and having no next move you could name.',
        'How long it has taken, how hard it feels and how you feel about it are all true and none of them separates the two states.',
        'If a statement points at something you could go and do, it is a route rather than a signal.',
      ],
      explanation: `The evidence: ${c.correct.join('; ')}.\n\nThe rest is scenery: ${c.incorrect.join('; ')}. ${c.why}\n\nThe reason to be strict about this is that the scenery is always present. Stuck and working feel almost identical from the inside, so a cue that fires on effort, difficulty or elapsed time will fire in both states and tell you nothing.`,
    }
  },
)

/**
 * The escalation ladder as an ordering task: cheapest first, and "cheapest"
 * has a checkable meaning — how much of the problem is left yours afterwards.
 * No study measures this exact ladder; it follows from the help-seeking
 * failure modes, and the explanation says so rather than borrowing authority.
 */
interface LadderCase {
  scene: string
  /** Least help taken first. */
  steps: string[]
  why: string
}

const LADDER_CASES: LadderCase[] = [
  {
    scene: 'A maths problem you cannot start, with a friend, a textbook and a teacher all available.',
    steps: [
      'Write down what you are given and what is wanted, in your own words',
      'Look back at one worked example and take only the first line from it',
      'Ask a friend what the first step is, then carry on by yourself',
      'Ask the teacher to walk through a whole problem of this type',
    ],
    why: 'Each rung hands over more of the problem than the one before it.',
  },
  {
    scene: 'A program with a bug you cannot find, with documentation, a forum and a teacher available.',
    steps: [
      'Print the value at the point where you think it first goes wrong',
      'Read the documentation for the one function you are least sure about',
      'Post the smallest failing example you can make, with what you expected',
      'Ask someone to sit with you and read the whole program through',
    ],
    why: 'Narrowing first is what makes every later rung cheaper for you and for them.',
  },
  {
    scene: 'An essay paragraph that will not start, with a plan, a friend and a teacher available.',
    steps: [
      'Say the point out loud in one sentence and write down whatever comes out',
      'Reread only the plan line this paragraph is meant to cover',
      'Ask a friend to read your topic sentence and say what they expect next',
      'Ask the teacher how they would structure this part of the argument',
    ],
    why: 'Producing a bad sentence costs nothing and often removes the block by itself.',
  },
  {
    scene: 'A physics question you cannot set up, with your notes, a friend and a teacher available.',
    steps: [
      'Draw the situation and label every quantity the question gives you',
      'Check your notes for which law connects the quantities you have labelled',
      'Ask a friend which quantity they started from, and nothing else',
      'Ask the teacher to set up a question of this shape from the beginning',
    ],
    why: 'A labelled diagram is the cheapest rung and the one most likely to make the rest unnecessary.',
  },
  {
    scene: 'A passage of music that keeps collapsing, with a recording, a friend and a teacher available.',
    steps: [
      'Slow it down until it is clean and find the exact beat where it breaks',
      'Listen to the recording for that one bar only, twice',
      'Ask someone to watch your hands through that bar and say what they see',
      'Ask your teacher to rework the fingering for the whole passage',
    ],
    why: 'Locating the break is what turns a vague "it goes wrong" into a question anyone can answer.',
  },
  {
    scene: 'A translation you cannot finish, with a dictionary, a classmate and a teacher available.',
    steps: [
      'Mark the one word or ending you are actually unsure about',
      'Look up that word, and check the ending in the grammar table',
      'Ask a classmate to confirm the tense you have chosen, and nothing more',
      'Ask the teacher to go through the whole sentence with you',
    ],
    why: 'Marking the blocker first is what stops the later rungs re-teaching the parts you had.',
  },
]

const stuckEscalate = tpl(
  {
    id: 'md-stuck-escalate',
    name: 'Order the ladder of help',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 2,
    variants: LADDER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, LADDER_CASES)
    return {
      title: 'Cheapest help first',
      prompt: `**The situation.** ${c.scene}\n\nPut these four moves in the order you should try them, starting with the one that leaves the most of the problem yours.`,
      answer: ordered(rng, c.steps),
      hints: [
        'Rank them by one question: after this move, how much of the problem is still mine to do?',
        'Moves you make on your own paper come before moves that spend someone else’s time.',
        `The principle: ${c.why}`,
      ],
      explanation: `The order is:\n1. ${c.steps[0]}\n2. ${c.steps[1]}\n3. ${c.steps[2]}\n4. ${c.steps[3]}\n\n${c.why} The ladder exists because help-seeking fails in two directions: taking a full walkthrough removes the part that would have taught you something, and taking nothing at all spends an hour to learn less than one hint would have. Climbing one rung at a time and stopping the moment you are moving again is the version that avoids both.\n\nBeing straight about the evidence: no study tests this exact four-rung ladder. What is supported is that help-seeking has those two failure modes and that attempting before being shown beats being shown first. The ordering is a sensible rule of thumb built on top of that, not a finding.`,
    }
  },
)

// =====================================================================
// x-interleave — mixing practice, and the cases where blocking wins
// =====================================================================

/**
 * Three of the eight cases have BLOCKED as the key. That ratio is the content
 * position, not a stylistic choice: the interleaving benefit is conditional on
 * confusable categories, a delay, and a mixed test, and Sorensen & Woltz (2016)
 * found blocked exposure better while a category is still forming. One
 * distractor in each blocked case is the overgeneralisation, worded the way a
 * learner would word it.
 */
interface BlockCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const BLOCK_CASES: BlockCase[] = [
  {
    scene:
      'Three kinds of quadratic problem that students routinely mix up. The unit test is in twelve days and shuffles all three without labelling them.',
    key: 'Shuffle the three types through every session',
    decoys: [
      'Work through one type at a time, finishing each before starting the next one',
      'Spend all of the time on whichever of the three types is currently the weakest',
      'Do one type per evening, changing which type you start the week with each week',
      'Do all three types every evening, but always in the same fixed order each time',
    ],
    why: 'Confusable types, a real delay, and a test that mixes them — all three conditions present, so mixing has something to buy. Note that changing which block comes first changes nothing inside a block: the type is still announced before you read the question.',
  },
  {
    scene:
      'A method for solving simultaneous equations, met for the first time this afternoon. Homework is tonight; the unit test is five weeks away.',
    key: 'Keep tonight blocked and mix it in later this week',
    decoys: [
      'Shuffle it with two other topics from the term straight away, from tonight onwards',
      'Mix it with the hardest topic you know, because harder practice always works better',
      'Alternate it with an unrelated topic every second question all the way through',
      'Split tonight in half: the new method first, then a mixed set of everything else',
    ],
    why: 'A method met hours ago is not yet reliable enough to be interrupted every other question. Blocked exposure has been found better than mixing at exactly this stage, while a category is still being formed. The answer is about timing: tonight it needs to become executable, next week it needs mixing.',
  },
  {
    scene:
      'Twenty irregular verbs for a vocabulary quiz tomorrow morning. The quiz covers only those twenty and nothing else on the course.',
    key: 'Keep it blocked — one list, one night',
    decoys: [
      'Mix the twenty in with the two other verb lists, since mixing beats blocking',
      'Mix them with the vocabulary from last term to make the practice feel harder',
      'Alternate between the twenty verbs and the grammar exercises for the same unit',
      'Cover all three of the verb lists equally so that nothing gets left behind here',
    ],
    why: 'There is one list, one night and nothing confusable to tell apart, so two thirds of a mixed session would go on material the quiz never asks about. The first two decoys are the overgeneralisation, and it is worth being able to spot: difficulty is not useful because it is difficult.',
  },
  {
    scene:
      'Three tennis strokes for a match in a month. In a match the ball arrives without warning and the stroke has to be chosen before it is played.',
    key: 'Feed the three in an order the player cannot predict',
    decoys: [
      'Feed forty of each stroke in turn, so that each one gets proper repetition',
      'Feed the three in a fixed repeating cycle so all of them get equal practice',
      'Spend the whole session on the stroke that is currently the least reliable one',
      'Feed forty of each, then finish every session with ten mixed balls at the end',
    ],
    why: 'A blocked feed removes the hardest part of a match — reading the ball and choosing the stroke — and never puts it back. A fixed repeating cycle is still predictable, which is the same problem in a smaller package.',
  },
  {
    scene:
      'One endgame that keeps losing you games. The club match is in two days and it is the only weakness you have identified.',
    key: 'Keep it blocked for the two days',
    decoys: [
      'Mix it with openings and tactics puzzles, because mixed practice tests better',
      'Mix in three unrelated endgames so that the practice sessions feel harder',
      'Play full games instead, so that the endgame arrives in its natural context',
      'Split the two days: one on the endgame, one on everything else you might need',
    ],
    why: 'Mixing buys the ability to tell confusable things apart on a delayed test. There is one thing here and two days, so there is nothing to tell apart and no delay to survive. Worth saying plainly: no study covers this exact case, so this is reasoning from the conditions the evidence identifies rather than a finding.',
  },
  {
    scene:
      'Four kinds of graph question in a statistics course. Students confuse two of them constantly. The exam is in six weeks and mixes all four.',
    key: 'Shuffle all four, with the confusable pair appearing often',
    decoys: [
      'Block the two confusable ones together and shuffle the other two separately',
      'Work through the four types in blocks, spending longest on the confusable pair',
      'Shuffle only the two confusable types and leave the other two out completely',
      'Do a block of each type first, and then one mixed session in the final week',
    ],
    why: 'Mixing pays most where the types are genuinely easy to mistake for one another, so the confusable pair should be the part that turns up unannounced most often. Blocking the pair together is the exact arrangement in which they never have to be told apart, and a single mixed session at the end leaves no time to act on what it reveals.',
  },
  {
    scene:
      'A new bandaging technique, taught this morning, that the trainee has not yet completed correctly even once. The assessment is in six weeks.',
    key: 'Repeat it until one clean run happens, then start mixing',
    decoys: [
      'Mix it with the other two techniques immediately, since the assessment mixes them',
      'Mix it with the hardest technique on the course to make the practice harder',
      'Leave it for a week and come back to it once the other techniques are solid',
      'Alternate it with a second technique every attempt, right from the first one',
    ],
    why: 'Interleaving trains choosing between methods, which is worth nothing until each method can be run at all. The assessment does mix them, and it is six weeks away, so mixing is right very soon — just not before the first clean repetition.',
  },
  {
    scene:
      'Three essay-question formats in a history course. The exam is in two months, and the paper names the format at the top of each question.',
    key: 'Mix them anyway — the choosing is not the only thing that fades',
    decoys: [
      'Block them, because the paper announces the format so choosing is not tested',
      'Block them and add one mixed practice paper in the last week before the exam',
      'Block them and spend the extra time reading model answers for each format',
      'Mix only the two formats that are most similar and block the third one alone',
    ],
    why: 'This is the interesting boundary case. The paper does announce the format, so the selection benefit is genuinely absent — but mixing also spaces each format out, and spacing helps over a two-month gap regardless. The honest reading is that the reason to mix here is the spacing, not the choosing, and blocking three formats into three long stretches wastes it.',
  },
]

const interleaveBlockedWins = tpl(
  {
    id: 'md-il-blocked-wins',
    name: 'Mix it, or keep it blocked?',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 3,
    variants: BLOCK_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, BLOCK_CASES)
    return {
      title: 'Not always mix',
      prompt: `**The situation.** ${c.scene}\n\nHow should the practice be arranged?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Check four things: how far off the test is, whether it mixes the types, whether the types are confusable, and whether each method is reliable yet.',
        'If any of those four is missing, mixing has nothing to buy and may cost you the time instead.',
        'Reordering blocks is not mixing. Inside a block the type is still announced before you read the question.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThe general shape: mixing trains CHOOSING between methods, and choosing is only worth training when there is something to choose between, a delay for it to survive, and a test that asks for it. The strongest classroom result behind this compared a delayed mixed test at 72% for mixed practice against 38% for blocked — but the pooled effect across studies is much smaller and varies a great deal, so "mix everything always" is a slogan rather than the finding.`,
    }
  },
)

/**
 * Which conditions does THIS plan actually satisfy? The correct set changes
 * case by case, which is what makes the item a reading of the situation rather
 * than a recall of four sentences.
 */
interface ConditionCase {
  scene: string
  holds: string[]
  fails: string[]
  verdict: string
}

const CONDITION_CASES: ConditionCase[] = [
  {
    scene:
      'Three types of stoichiometry problem that get confused constantly. The test is in three weeks and mixes them. All three methods can already be carried out.',
    holds: [
      'The types are genuinely easy to mistake for one another',
      'The test is far enough away for some forgetting to happen',
      'The test presents the types mixed together',
      'Each method is already reliable enough to run on its own',
    ],
    fails: [
      'The practice will feel harder than blocked practice does',
      'There are more different types here than a person can hold at once',
    ],
    verdict: 'All four conditions hold, so mixing is clearly the right call here.',
  },
  {
    scene:
      'One list of forty capital cities for a quiz tomorrow that covers only that list. You can already recall about half of them.',
    holds: ['The material can already be produced at least sometimes'],
    fails: [
      'There are several confusable types to tell apart',
      'The test is far enough away for forgetting to matter',
      'The test presents several types mixed together',
      'Mixing would leave enough time on the material being tested',
    ],
    verdict: 'One category, one night and one list: three of the four conditions are absent, so mixing would cost time and buy nothing.',
  },
  {
    scene:
      'A differentiation rule taught an hour ago that you have not yet applied correctly once. The exam is in two months and covers four rules mixed.',
    holds: [
      'The rules are easy to mistake for one another',
      'The exam is far enough away for forgetting to matter',
      'The exam presents the rules mixed together',
    ],
    fails: [
      'This rule can already be carried out reliably on its own',
      'The rule has been practised on enough different-looking problems',
    ],
    verdict: 'Three conditions hold and the fourth does not — which is exactly why the answer is "block tonight, mix from tomorrow" rather than one or the other forever.',
  },
  {
    scene:
      'Two grammar structures in a language course that learners almost never confuse. The exam is in a month and mixes them.',
    holds: [
      'The exam is far enough away for forgetting to matter',
      'The exam presents the structures mixed together',
      'Both structures can already be produced reliably',
    ],
    fails: ['The two structures are easy to mistake for one another'],
    verdict: 'Everything holds except the one that does most of the work. Where two things can never be confused, telling them apart costs nothing and there is nothing for mixing to train — though the spacing you get from mixing is still worth something over a month.',
  },
  {
    scene:
      'Three serve types for a tournament in five weeks. The player can hit all three. In a match the player chooses which serve to hit, without any time pressure on the choice.',
    holds: [
      'The tournament is far enough away for forgetting to matter',
      'All three can already be executed reliably',
      'The three are similar enough to interfere with one another',
    ],
    fails: ['The situation forces a choice under conditions you cannot predict'],
    verdict: 'A server chooses in their own time, so the unpredictable-selection condition is weaker here than in returning. Mixing is still reasonable for the spacing and the interference between similar movements, and that is the honest reason to give.',
  },
  {
    scene:
      'Four kinds of proof in a geometry course. Two are confused constantly, two are never confused with anything. The exam is in seven weeks and mixes all four.',
    holds: [
      'At least two of the types are genuinely easy to confuse',
      'The exam is far enough away for forgetting to matter',
      'The exam presents the types mixed together',
      'All four kinds of proof can already be written out',
    ],
    fails: ['Every one of the four types is confusable with the others'],
    verdict: 'The conditions hold, but not evenly: the confusable pair is where mixing earns most, so it should appear unannounced far more often than the other two.',
  },
]

const interleaveConditions = tpl(
  {
    id: 'md-il-conditions',
    name: 'Which conditions actually hold?',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 3,
    variants: CONDITION_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CONDITION_CASES)
    return {
      title: 'Check the conditions, then decide',
      prompt: `**The situation.** ${c.scene}\n\nMixing practice pays only when certain things are true. Select every statement below that is actually true of this situation.`,
      answer: multi(rng, [...c.holds], [...c.fails]),
      hints: [
        'Read each statement against the situation rather than against what you know about mixing in general.',
        'The four that matter are: confusable types, a delay, a mixed test, and methods that already run.',
        'A statement about how the practice FEELS is never one of the conditions.',
      ],
      explanation: `True here: ${c.holds.join('; ')}.\n\nNot true here: ${c.fails.join('; ')}.\n\n${c.verdict}\n\nChecking the conditions one at a time is the whole method. "Mixing is better" is a slogan; "mixing is better when the types are confusable, the test is delayed, the test is mixed, and each method already runs" is the actual finding, and the four clauses do different jobs.`,
    }
  },
)

/**
 * A genuine computation, and the entry point for the skill: how much of each
 * type lands in one session under a mixed schedule. Learners plan mixed
 * practice badly because they never work out what "equally mixed" means in
 * problems per evening.
 */
const MIX_PARAMS: { total: number; types: number; sessions: number; subject: string; label: string }[] = [
  { total: 36, types: 3, sessions: 4, subject: 'volume problems', label: 'prisms, cylinders and cones' },
  { total: 48, types: 4, sessions: 4, subject: 'graph questions', label: 'four chart types' },
  { total: 30, types: 3, sessions: 5, subject: 'equation problems', label: 'three solving methods' },
  { total: 60, types: 5, sessions: 4, subject: 'grammar exercises', label: 'five tenses' },
  { total: 24, types: 2, sessions: 6, subject: 'reaction questions', label: 'two reaction types' },
  { total: 72, types: 3, sessions: 6, subject: 'proof exercises', label: 'three proof styles' },
  { total: 40, types: 4, sessions: 5, subject: 'translation sentences', label: 'four sentence patterns' },
  { total: 54, types: 3, sessions: 3, subject: 'motion problems', label: 'three motion setups' },
]

const interleaveMixCount = tpl(
  {
    id: 'md-il-mix-count',
    name: 'Build the mixed session',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 2,
    variants: MIX_PARAMS.length,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const p = cycle(seed, MIX_PARAMS)
    const perSession = p.total / p.sessions
    const perType = perSession / p.types
    return {
      title: 'How many of each, per evening',
      prompt: `You have **${p.total} ${p.subject}** covering **${p.types} types** (${p.label}). They have to fit into **${p.sessions} practice sessions** before a test that mixes all ${p.types} types.\n\nEvery session should contain all ${p.types} types in equal numbers. How many problems of each type go in one session? (Number only.)`,
      answer: numeric(perType),
      hints: [
        'Two steps. First: how many problems does one session hold if the total is shared out evenly?',
        `Second: split that session between the ${p.types} types.`,
        `Worked path: ${p.total} ÷ ${p.sessions} = ${perSession} per session, and ${perSession} ÷ ${p.types} = ${perType} of each type.`,
      ],
      explanation: `${p.total} ÷ ${p.sessions} = ${perSession} problems per session, and ${perSession} ÷ ${p.types} = **${perType}** of each type per session.\n\nThe number matters more than it looks. A "mixed" plan that puts ${perSession} problems of one type in one evening and ${perSession} of the next type the following evening is a blocked plan wearing a mixed label — the type is still announced by the evening it lands in. Mixing means the type changes inside the session, ideally without warning, so that choosing the method is part of every question rather than a decision made once at the start.`,
    }
  },
)

/**
 * Sorting whole plans, which forces the conditions to be applied rather than
 * recited. Three per side in every case, so a learner who always picks one
 * category scores exactly half and learns nothing from having done so.
 */
interface PlanSortCase {
  setting: string
  mix: string[]
  block: string[]
  why: string
}

const PLAN_SORT_CASES: PlanSortCase[] = [
  {
    setting: 'A school term with several tests coming up.',
    mix: [
      'Three confusable triangle rules, exam in a month, exam mixes them',
      'Four chord shapes for a gig in six weeks, played in any order',
      'Three essay formats, exam in two months, each already writable',
    ],
    block: [
      'A brand-new method met an hour ago, homework due tonight',
      'One spelling list for a test tomorrow covering only that list',
      'A single weak opening before a chess match in two days',
    ],
    why: 'The mix side has confusable material, a real delay and a mixed test. The block side is missing at least two of those every time.',
  },
  {
    setting: 'A month of sports and music practice.',
    mix: [
      'Three tennis returns for a match in five weeks, ball arrives unannounced',
      'Three drum fills for a performance in a month, cued by the singer',
      'Two similar dance steps confused constantly, show in six weeks',
    ],
    block: [
      'A new grip held correctly for the first time this afternoon',
      'One passage that collapses, with a performance the day after tomorrow',
      'A serve motion being rebuilt from scratch under a coach today',
    ],
    why: 'Anything still being formed goes in the blocked pile, and so does anything with no delay left to survive.',
  },
  {
    setting: 'Revision planning across four subjects.',
    mix: [
      'Three percentage question types confused on every past paper, exam in a month',
      'Four unit-conversion families, exam in seven weeks, exam mixes them',
      'Three quotation-analysis approaches, exam in two months, all writable',
    ],
    block: [
      'A formula you have never once applied correctly, test in three days',
      'One definition list for a quiz tomorrow on that list alone',
      'A single practical technique to be demonstrated in the morning',
    ],
    why: 'A test tomorrow removes the delay, and a method you cannot yet run removes the thing mixing would train.',
  },
  {
    setting: 'A language course with several kinds of assessment.',
    mix: [
      'Three past tenses confused constantly, written exam in six weeks',
      'Four question forms, speaking exam in a month, asked in any order',
      'Two similar prepositions mixed up in every piece of work, exam in five weeks',
    ],
    block: [
      'A new alphabet learned this week, none of it yet reliable',
      'One vocabulary list for tomorrow morning covering that list only',
      'A pronunciation fix introduced by the teacher this afternoon',
    ],
    why: 'Confusable pairs are where mixing earns most; brand-new material is where blocking still earns its place.',
  },
  {
    setting: 'A practical course with a mixed assessment at the end.',
    mix: [
      'Three bandage types, assessor names one at random in five weeks',
      'Three knife cuts already reliable, cooking test in a month',
      'Two similar knots confused under pressure, assessment in six weeks',
    ],
    block: [
      'A knot being learned for the very first time this morning',
      'One technique being assessed by itself first thing tomorrow',
      'A grip the trainee has not yet held correctly on any attempt',
    ],
    why: 'The assessment naming the item at random is the clearest possible case for mixing; a first-ever attempt is the clearest case against it.',
  },
  {
    setting: 'A computing course with coursework and an exam.',
    mix: [
      'Three sorting methods confused on paper, exam in six weeks, mixed',
      'Four loop patterns already writable, exam in two months',
      'Two similar data structures mixed up constantly, exam in a month',
    ],
    block: [
      'Recursion met this afternoon, not yet traced correctly once',
      'One syntax rule being tested in a short quiz tomorrow morning',
      'A debugging tool being used for the first time in today’s lab',
    ],
    why: 'Every blocked case fails the same condition: there is nothing yet to choose between, or nothing left of the delay.',
  },
]

const interleaveSortPlans = tpl(
  {
    id: 'md-il-sort-plans',
    name: 'Sort the practice plans',
    skillIds: ['x-interleave'],
    bucket: 'meta',
    difficulty: 3,
    variants: PLAN_SORT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, PLAN_SORT_CASES)
    return {
      title: 'Mix it or block it',
      prompt: `**Context.** ${c.setting}\n\nSort each situation. Mixing pays when the types are confusable, the day is far enough off for forgetting, the test mixes them, and each method already runs.`,
      answer: classify(
        rng,
        ['Mix them', 'Keep it blocked'],
        [...c.mix.map((text) => ({ text, category: 0 })), ...c.block.map((text) => ({ text, category: 1 }))],
      ),
      hints: [
        'Run the same four checks on every line: confusable, delayed, mixed test, already runs.',
        'Two things push a case into the blocked pile on their own: the skill is brand new, or the day is tomorrow.',
        `The pattern in this set: ${c.why}`,
      ],
      explanation: `**Mix them:** ${c.mix.join('; ')}.\n\n**Keep it blocked:** ${c.block.join('; ')}.\n\n${c.why}\n\nHalf of the point of this sort is that the blocked pile exists at all. A bank where the answer is always "mix" would teach a rule that fails on the two cases people actually meet most — the thing learned this morning, and the test that is tomorrow.`,
    }
  },
)

// EXTEND-HERE

export const META_DEPTH_TEMPLATES: ItemTemplate[] = [
  stuckSortSignals,
  stuckSecondRepeat,
  stuckSmallestAsk,
  stuckWhichSignals,
  stuckEscalate,
  interleaveBlockedWins,
  interleaveConditions,
  interleaveMixCount,
  interleaveSortPlans,
]
