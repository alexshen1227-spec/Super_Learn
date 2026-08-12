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
      'Ask them to work the whole problem through with you',
      'Ask to photograph their page and compare line by line',
      'Say nothing and hand in whatever you have',
      'Ask which questions on the sheet they found hardest',
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
      'Ask them to check every line of the working you have done so far, from the start',
      'Ask what mark you would get for the working you have written down so far',
    ],
    why: 'A precise blocker gets a precise answer inside the minute you actually have. "Explain the whole topic" spends the minute on the ninety per cent you already had, and asking about the exam swaps a learning question for a reassurance one.',
  },
  {
    scene: 'A hint ladder is open in front of you and you have read the first hint without trying anything since.',
    key: 'Close it and try again before opening the second hint',
    decoys: [
      'Open all of the remaining hints at once',
      'Refuse every hint from here on',
      'Open the last hint first, for the actual method',
      'Leave the item and come back when you feel sharper later',
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
      'Keep going until it cracks; stopping now is giving up',
      'Look up the full worked answer and read it through',
      'Abandon the set for tonight, since the block has won',
      'Search for a video on the topic and watch the whole thing through',
    ],
    why: 'The written blocker is what makes coming back cheap; without it you restart from nothing. Reading a worked answer you have not earned produces recognition rather than the ability to do it, and grinding past the point where new information stopped arriving is the least productive time in any session.',
  },
  {
    scene:
      'You do not understand what the question is asking, and you have not written anything down yet.',
    key: 'List what you are given and what is wanted, in your own words',
    decoys: [
      'Ask for a hint about the method',
      'Read the question again slowly until it makes sense',
      'Skip it and come back once the others have warmed you up',
      'Look for a worked example on the page with the same shape as this one',
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
      'Work one type at a time, finishing each before the next',
      'Spend all the time on whichever type is weakest',
      'One type per evening, rotating the start day',
      'All three every evening, always in the same order',
    ],
    why: 'Confusable types, a real delay, and a test that mixes them — all three conditions present, so mixing has something to buy. Note that changing which block comes first changes nothing inside a block: the type is still announced before you read the question.',
  },
  {
    scene:
      'A method for solving simultaneous equations, met for the first time this afternoon. Homework is tonight; the unit test is five weeks away.',
    key: 'Keep tonight blocked and mix it in later this week',
    decoys: [
      'Shuffle it with two other topics from tonight onwards',
      'Mix it with the hardest topic you know',
      'Alternate with an unrelated topic every second question',
      'New method first tonight, then a mixed set of the rest',
    ],
    why: 'A method met hours ago is not yet reliable enough to be interrupted every other question. Blocked exposure has been found better than mixing at exactly this stage, while a category is still being formed. The answer is about timing: tonight it needs to become executable, next week it needs mixing.',
  },
  {
    scene:
      'Twenty irregular verbs for a vocabulary quiz tomorrow morning. The quiz covers only those twenty and nothing else on the course.',
    key: 'Keep it blocked — one list, one night',
    decoys: [
      'Mix the twenty in with the two other verb lists',
      'Mix them with last term’s vocabulary to make it harder',
      'Alternate the verbs with the unit’s grammar exercises',
      'Cover all three verb lists equally',
    ],
    why: 'There is one list, one night and nothing confusable to tell apart, so two thirds of a mixed session would go on material the quiz never asks about. The first two decoys are the overgeneralisation, and it is worth being able to spot: difficulty is not useful because it is difficult.',
  },
  {
    scene:
      'Three tennis strokes for a match in a month. In a match the ball arrives without warning and the stroke has to be chosen before it is played.',
    key: 'Feed the three in an order the player cannot predict',
    decoys: [
      'Feed forty of each stroke in turn',
      'Feed the three in a fixed repeating cycle',
      'Spend the session on the least reliable stroke',
      'Forty of each in turn, then ten mixed balls at the very end',
    ],
    why: 'A blocked feed removes the hardest part of a match — reading the ball and choosing the stroke — and never puts it back. A fixed repeating cycle is still predictable, which is the same problem in a smaller package.',
  },
  {
    scene:
      'One endgame that keeps losing you games. The club match is in two days and it is the only weakness you have identified.',
    key: 'Keep it blocked for the two days',
    decoys: [
      'Mix it with openings and tactics puzzles',
      'Mix in three unrelated endgames to make it harder',
      'Play full games instead',
      'One day on the endgame, one on everything else',
    ],
    why: 'Mixing buys the ability to tell confusable things apart on a delayed test. There is one thing here and two days, so there is nothing to tell apart and no delay to survive. Worth saying plainly: no study covers this exact case, so this is reasoning from the conditions the evidence identifies rather than a finding.',
  },
  {
    scene:
      'Four kinds of graph question in a statistics course. Students confuse two of them constantly. The exam is in six weeks and mixes all four.',
    key: 'Shuffle all four, with the confusable pair appearing often',
    decoys: [
      'Block the confusable pair together, shuffle the rest',
      'Work in blocks, spending longest on the confusable pair',
      'Shuffle only the confusable pair and drop the other two',
      'A block of each type first, then one mixed session at the end',
    ],
    why: 'Mixing pays most where the types are genuinely easy to mistake for one another, so the confusable pair should be the part that turns up unannounced most often. Blocking the pair together is the exact arrangement in which they never have to be told apart, and a single mixed session at the end leaves no time to act on what it reveals.',
  },
  {
    scene:
      'A new bandaging technique, taught this morning, that the trainee has not yet completed correctly even once. The assessment is in six weeks.',
    key: 'Repeat it until one clean run happens, then start mixing',
    decoys: [
      'Mix it with the other two techniques immediately',
      'Mix it with the hardest technique to make it harder',
      'Leave it a week until the other techniques are solid',
      'Alternate it with a second technique from the first attempt on',
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
      'Block them and read model answers instead',
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

// =====================================================================
// x-method — naming the method before solving anything
// =====================================================================

/**
 * The entry point: one problem, four method names, nothing to calculate. The
 * existing method drill samples real stems from the academic banks; this
 * family is authored so that the DECIDING FEATURE can be named in the
 * explanation, which the sampled drill cannot do.
 *
 * Scenarios here are deliberately disjoint from `x-method-contrast`, which
 * already covers percent bases, steady versus changing speed, right angles
 * versus angle sums, complements, variables on both sides, centre versus
 * spread, density versus Ohm's law, and equal groups versus linear models.
 */
interface NameCase {
  problem: string
  key: string
  decoys: string[]
  cue: string
  why: string
}

const NAME_CASES: NameCase[] = [
  {
    problem:
      'A phone plan charges £8 a month plus 3p a minute. A second charges nothing monthly and 11p a minute. When do they cost the same?',
    key: 'Set two "start plus rate" expressions equal',
    decoys: [
      'Compare the two per-minute rates directly',
      'Find what share of the bill is the monthly charge',
      'Divide the fixed charge by the difference in rates',
      'Multiply the minutes by the cheaper plan’s rate',
    ],
    cue: 'one option carries a fixed cost the other does not, and the two totals are being set equal',
    why: 'The third decoy is the interesting one: £8 ÷ 8p really does give the crossing point here, but only because the second plan has no fixed cost. As a method it is a memorised shortcut that breaks the moment both plans charge a monthly fee, which is why the setup is the thing to name.',
  },
  {
    problem:
      'A bag has 7 green and 5 yellow counters. Three are taken out without replacing any. What is the chance that all three are green?',
    key: 'Multiply the chances, updating what is left each time',
    decoys: [
      'Count how many groups of three could be drawn',
      'Multiply seven twelfths by itself three times',
      'Add the three chances and divide by three',
      'Take one minus the chance of drawing no green counters',
    ],
    cue: 'the counters are not put back, so the second draw comes from what is actually left',
    why: 'The second decoy is what you would use WITH replacement, and it differs by one word in the question. The fourth is the complement method, which answers "at least one green" rather than "all three".',
  },
  {
    problem:
      'A recipe for 6 people uses 450 g of rice. How much rice is needed for 15 people?',
    key: 'Scale by the ratio of the two group sizes',
    decoys: [
      'Name an unknown and undo the operations in turn',
      'Find the percentage increase from six to fifteen',
      'Add nine extra portions to the original amount',
      'Divide 450 by 6 and stop there',
    ],
    cue: 'both quantities grow together at a fixed rate, so one number scales the other',
    why: 'The additive decoy is the classic error and it is worth naming: nine extra people is not nine extra portions of anything until you know what one portion is. The percentage route reaches the same answer by a longer road and is not wrong, only slower.',
  },
  {
    problem:
      'A savings account holds £2,000 and grows by 4% each year. How much is in it after 6 years?',
    key: 'Repeated multiplication by the growth factor',
    decoys: [
      'Add four per cent of the start on six times',
      'Take 24% of the starting amount in one go',
      'Use a linear model with a constant yearly rise',
      'Divide the total growth by six and add it on',
    ],
    cue: 'the percentage is taken of the CURRENT amount each year, not of the starting amount',
    why: 'The first two decoys are the same mistake stated twice, and it is the commonest one there is: treating a percentage of a changing amount as a fixed sum. Naming the method as "multiply by 1.04 six times" makes the difference visible before any arithmetic happens.',
  },
  {
    problem:
      'A rectangle has a perimeter of 34 cm and is 5 cm longer than it is wide. Find its dimensions.',
    key: 'Name one unknown and write the other in terms of it',
    decoys: [
      'Divide the perimeter by four and adjust upwards',
      'Try whole-number pairs until one fits both conditions',
      'Use the area formula, since two sides are wanted',
      'Take three off the perimeter and halve the rest',
    ],
    cue: 'two unknowns with a stated relationship between them, and one equation linking them',
    why: 'Trial and error would work here and is worth respecting, but it is a search rather than a method, and it stops working the moment the numbers are not whole. The relationship "5 cm longer" is what makes one letter enough.',
  },
  {
    problem:
      'A ladder leans against a wall. Its foot is 1.8 m from the wall and it reaches 4.8 m up. How long is the ladder?',
    key: 'Square the two known sides and add',
    decoys: [
      'Use the ratio of the two known lengths',
      'Add the two lengths together',
      'Use the base angle with one known side',
      'Divide the height by the distance from the wall',
    ],
    cue: 'a right angle, with two sides known and the side opposite the right angle wanted',
    why: 'The angle route is not wrong in principle and is unusable here, because no angle is given. That is the useful discrimination: a method is only available if the problem feeds it.',
  },
  {
    problem:
      'A survey of 240 students found 90 walk to school. A second school has 400 students. How many would you expect to walk, if the schools are alike?',
    key: 'Turn the first result into a rate and apply it',
    decoys: [
      'Scale by the difference in the two school sizes',
      'Add 160 to the 90 who already walk',
      'Work out what per cent 240 is of 400',
      'Divide 400 by 240 and use that as the count',
    ],
    cue: 'a proportion measured in one group is being carried across to a second group',
    why: 'The third decoy inverts the comparison, which is the commonest slip in proportion problems: it computes 240 as a percentage of 400 when the rate that transfers is 90 out of 240. Naming the method as "rate, then apply" fixes the direction before any numbers move.',
  },
  {
    problem:
      'Three machines each produce 40 parts an hour. A fourth produces 25. How long to make 1,050 parts with all four running?',
    key: 'Add the rates, then divide the total wanted by it',
    decoys: [
      'Average the four machines’ individual times',
      'Give each machine a quarter of the total',
      'Divide the total by the fastest rate alone',
      'Add up the four times each would take alone, then average',
    ],
    cue: 'several rates acting together in the same direction, on the same total',
    why: 'Averaging the TIMES is the trap and it is a real one — rates add, times do not. The two decoys that average times would both give an answer that is out by more than a factor of three here.',
  },
]

const methodNameIt = tpl(
  {
    id: 'md-me-name-it',
    name: 'Name the method, do not solve',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 2,
    variants: NAME_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, NAME_CASES)
    return {
      title: 'Method first',
      prompt: `**Do not solve it.** Read the problem and say what would be done to it.\n\n${c.problem}`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Read the question sentence first: what quantity has to exist at the end?',
        'Then describe the problem with no nouns in it — what is given, what changes, what is wanted.',
        `The deciding feature here: ${c.cue}.`,
      ],
      explanation: `${c.key}. The feature that decides it: ${c.cue}. ${c.why}\n\nNaming the method before touching the numbers is worth practising separately because it is the step that mixed tests actually examine. Inside a chapter the method arrives with the page number, so the choosing never happens; on a mixed paper it is the only part that is genuinely hard, and it is the part nobody rehearses.`,
    }
  },
)

/**
 * Four methods named up front, one problem underneath. This is the reverse of
 * the drill above: the options are held constant across the four problems in a
 * case, so the learner cannot use the shape of the option list as a clue and
 * has to read the problem.
 */
interface FourWayCase {
  methods: string[]
  problem: string
  /** Index into `methods`. */
  keyIndex: number
  why: string
}

const FOUR_WAY_CASES: FourWayCase[] = [
  {
    methods: [
      'Find the unit rate and multiply up',
      'Undo the percentage change by dividing',
      'Set two expressions equal and solve for the crossing point',
      'Multiply the separate chances of independent events together',
    ],
    problem: 'A jacket is £51 after a third has been taken off the price. What did it cost before?',
    keyIndex: 1,
    why: 'The £51 is the amount AFTER the change, so the method has to run the change backwards. A unit rate would be right if the question compared amounts, and it does not.',
  },
  {
    methods: [
      'Find the unit rate and multiply up',
      'Undo the percentage change by dividing',
      'Set two expressions equal and solve for the crossing point',
      'Multiply the separate chances of independent events together',
    ],
    problem: 'Two taxi firms charge a £3 pickup plus 90p a mile, and no pickup plus £1.35 a mile. When is the cost equal?',
    keyIndex: 2,
    why: 'Two totals, each a fixed amount plus a rate, and the question asks where they meet. The word "equal" is doing the work.',
  },
  {
    methods: [
      'Count the arrangements by multiplying the number of choices at each stage',
      'Work out one minus the chance that none of them happens',
      'Compare the middle values of the two sets',
      'Compare how spread out the two sets are',
    ],
    problem: 'A lift breaks down on about one journey in twenty. Over eight journeys, what is the chance of at least one breakdown?',
    keyIndex: 1,
    why: '"At least one" bundles seven separate cases together, and its opposite — none at all — is a single clean calculation. Counting arrangements answers a different question entirely.',
  },
  {
    methods: [
      'Count the arrangements by multiplying the number of choices at each stage',
      'Work out one minus the chance that none of them happens',
      'Compare the middle values of the two sets',
      'Compare how spread out the two sets are',
    ],
    problem: 'Two bus routes both average 22 minutes. One is reliably 20 to 24; the other ranges from 9 to 40. Which is the better route to rely on?',
    keyIndex: 3,
    why: 'The averages are identical, so any method that compares centres cannot separate them. Reliability is a question about spread, and the ranges answer it immediately.',
  },
  {
    methods: [
      'Add the rates and turn the total back into a time',
      'Multiply by the growth factor once per period',
      'Square the two known sides and add them',
      'Write one unknown in terms of the other and solve',
    ],
    problem: 'A population of 800 rabbits increases by 12% each season. What is it after 5 seasons?',
    keyIndex: 1,
    why: 'The increase is taken of the current number each season, not of the starting number, so it multiplies rather than adds. A linear model would undercount badly by the fifth season.',
  },
  {
    methods: [
      'Add the rates and turn the total back into a time',
      'Multiply by the growth factor once per period',
      'Square the two known sides and add them',
      'Write one unknown in terms of the other and solve',
    ],
    problem: 'Two friends fold leaflets. Alone, one would take 40 minutes and the other 60. How long together?',
    keyIndex: 0,
    why: 'Two steady rates acting at once on the same job. Averaging the two times is the trap and it is wrong by a wide margin, because rates add and times do not.',
  },
  {
    methods: [
      'Carry the measured proportion across to the new group',
      'Take the difference and express it as a fraction of the start',
      'Read the value off the line of best fit drawn through the scatter',
      'Work out how many of each type fit in one session',
    ],
    problem: 'A club had 45 members last year and has 63 now. By what percentage has it grown?',
    keyIndex: 1,
    why: 'The question asks for a change relative to where it started, which is a difference over the original amount. Carrying a proportion across would be the method if a second club were involved.',
  },
  {
    methods: [
      'Carry the measured proportion across to the new group',
      'Take the difference and express it as a fraction of the start',
      'Read the value off the line of best fit drawn through the scatter',
      'Work out how many of each type fit in one session',
    ],
    problem: 'In a sample of 150 books, 24 were damaged. A second shipment holds 500 similar books. How many damaged ones would you expect?',
    keyIndex: 0,
    why: 'A rate measured in one group is being carried to a second group of a different size. Nothing here is a change over time, which is what rules out the percentage-change method.',
  },
]

const methodFourWay = tpl(
  {
    id: 'md-me-four-methods',
    name: 'Which of these four?',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 3,
    variants: FOUR_WAY_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, FOUR_WAY_CASES)
    const key = c.methods[c.keyIndex]
    return {
      title: 'Four methods on the table',
      prompt: `Four methods are on the table. Do not solve anything — say which one this problem calls for.\n\n**Problem.** ${c.problem}`,
      answer: mcq(rng, key, c.methods.filter((_, i) => i !== c.keyIndex)),
      hints: [
        'Take each method in turn and ask what the problem would have to look like for that method to be the right one.',
        'Then check what the problem actually gives you. A method you cannot feed is not a candidate.',
        'The question sentence usually names the deciding feature: "at least", "equal", "after", "each".',
      ],
      explanation: `${key}. ${c.why}\n\nOffering the same four methods against different problems is deliberate. When the options change with the problem, the shape of the list becomes a clue; when they stay fixed, the only way through is to read the problem and check what it feeds.`,
    }
  },
)

/**
 * The problem that looks like one method and needs another. Every case names
 * the tempting method in the prompt, which makes the item harder rather than
 * easier: the pull is real, and resisting it is the skill.
 */
interface LooksLikeCase {
  problem: string
  looks: string
  key: string
  decoys: string[]
  why: string
}

const LOOKS_LIKE_CASES: LooksLikeCase[] = [
  {
    problem:
      'A shop raises a price by 20% in March and lowers it by 20% in September. Is the September price the same as the January one?',
    looks: 'adding and subtracting the same percentage, which cancels',
    key: 'Multiply by 1.2 and then by 0.8 and compare',
    decoys: [
      'Add 20% and subtract 20%, which cancels out',
      'Take 40% off, since two changes of 20% were made',
      'Average the two prices to find where it settles',
      'Subtract one percentage from the other and apply it',
    ],
    why: 'The two 20% changes are taken of DIFFERENT amounts — the second of a raised price — so they cannot cancel. 1.2 × 0.8 = 0.96, leaving the price 4% lower than it started.',
  },
  {
    problem:
      'A car travels 60 km at 30 km/h and returns along the same road at 60 km/h. What is its average speed for the whole trip?',
    looks: 'averaging the two speeds',
    key: 'Total distance divided by total time',
    decoys: [
      'Take the mean of the two speeds: 45 km/h',
      'Weight the mean by distance, as the legs are equal',
      'Take the faster of the two speeds',
      'Add the speeds and divide by the number of legs',
    ],
    why: 'The car spends twice as long on the slow leg, so the slow speed carries twice the weight. Two hours out and one hour back is 120 km in 3 hours, which is 40 km/h — and the equal DISTANCES are exactly what makes the equal-weight average wrong.',
  },
  {
    problem:
      'A test flags 99% of the people who have a condition and wrongly flags 2% of those who do not. About 1 person in 500 has it. Someone is flagged. How likely is it that they have it?',
    looks: 'reading the 99% as the answer',
    key: 'Count how many of each group get flagged out of 500',
    decoys: [
      'Take 99%, the rate at which it catches the condition',
      'Take 97%, the accuracy left after the errors',
      'Take the gap between 99% and 2%',
      'Take 1%, the rate at which it misses cases',
    ],
    why: 'Out of 500 people about 1 has the condition and about 10 healthy people are flagged, so a flag is right about 1 time in 11. The 99% answers a different question: given the condition, how often does the test fire.',
  },
  {
    problem:
      'A rope is cut into two pieces, one 3 m longer than the other. The longer piece is then cut in half. The three pieces total 15 m. How long was the shorter original piece?',
    looks: 'splitting fifteen into three equal parts',
    key: 'Name the short piece and write everything else from it',
    decoys: [
      'Divide 15 by three, one for each final piece',
      'Divide 15 by two, since the first cut made two',
      'Take three metres off the 15 and split what is left into three',
      'Halve the 15 and take three off one of the halves',
    ],
    why: 'The three final pieces are not equal, and the total is unchanged by the second cut: short + (short + 3) = 15, so the short piece is 6 m. Counting pieces instead of tracking lengths is what makes the division look reasonable.',
  },
  {
    problem:
      'Two schools each raised their pass rate this year. Combined across both schools, the pass rate fell. Is that possible?',
    looks: 'concluding that a mistake must have been made',
    key: 'Check how many students each school had in each year',
    decoys: [
      'Conclude an arithmetic error was made somewhere',
      'Conclude the two schools define a pass differently',
      'Average the two rates, which cannot fall if both rose',
      'Conclude the combined figure covers a different period',
    ],
    why: 'It is possible, and it is the reason group sizes have to travel with rates. If far more students sat the exam at the school with the lower rate this year, the combined figure is pulled towards that school even though both improved.',
  },
  {
    problem:
      'A pond weed covers 4 m² and doubles every week. The pond is 256 m². It fills in week 6. In which week was it half covered?',
    looks: 'halving the six weeks',
    key: 'Step back one doubling from the full pond',
    decoys: [
      'Take half of six weeks, so week three',
      'Take a third of the way in, as growth speeds up',
      'Average week one and week six',
      'Divide 256 by two and find the week that passes it',
    ],
    why: 'One doubling before full is half full, so it is week 5 — halfway in AREA is nowhere near halfway in TIME. The arithmetic-average instinct is what growth by multiplication defeats.',
  },
  {
    problem:
      'A committee of 3 is chosen from 8 people. How many different committees are possible?',
    looks: 'multiplying the choices in turn',
    key: 'Count the arrangements, then remove the reorderings',
    decoys: [
      'Multiply 8 by 7 by 6, one for each place',
      'Multiply 8 by 3, people times places',
      'Take 8 cubed, as each place could be any of the eight',
      'Add the choices at each stage together',
    ],
    why: '8 × 7 × 6 counts the same three people in six different orders. A committee has no order, so the count has to be divided by the 6 ways of arranging three chosen people. The multiplication is a correct first step and a wrong final answer.',
  },
  {
    problem:
      'A river flows at 2 km/h. A boat travels 12 km upstream and 12 km back, moving at 6 km/h in still water. Does the current cost it any time overall?',
    looks: 'the help downstream cancelling the hindrance upstream',
    key: 'Work out each leg separately and add the times',
    decoys: [
      'It cancels: the current helps as much as it hinders',
      'It cancels, since both legs are the same distance',
      'Use the still-water speed for the whole trip',
      'Average the upstream and downstream speeds',
    ],
    why: 'The boat spends 3 hours going up at 4 km/h and 1.5 hours coming back at 8 km/h — 4.5 hours against 4 hours with no current. The slower leg lasts longer, so it carries more weight, which is the same structure as the average-speed case above wearing a different cover story.',
  },
]

const methodLooksLike = tpl(
  {
    id: 'md-me-looks-like',
    name: 'Looks like one method, needs another',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 4,
    variants: LOOKS_LIKE_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, LOOKS_LIKE_CASES)
    return {
      title: 'The tempting method is the wrong one',
      prompt: `**Problem.** ${c.problem}\n\nMost people reach for ${c.looks}. Do not solve it — say what would actually have to be done.`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what the tempting method quietly assumes, and check whether the problem grants it.',
        'Look for a quantity that is not what it appears to be: a percentage of a changed amount, a time rather than a distance, a group that is not everyone.',
        'If two things are being combined, ask whether they should carry equal weight. Usually something says they should not.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThis is the failure mode that blocked practice hides completely. Inside a chapter the tempting method is the right one, because the chapter chose the problems; on a mixed paper, the problem that looks like the last one and is not is where the marks go. The habit that fixes it is small: before running a method, say out loud what it assumes.`,
    }
  },
)

/**
 * Sorting stems by method, six at a time, with the two methods chosen to be
 * genuinely confusable. A sort makes surface-matching visible: the stems in
 * each case share a subject, so grouping by topic scores 50%.
 */
interface StemSortCase {
  a: string
  b: string
  aStems: string[]
  bStems: string[]
  why: string
}

const STEM_SORT_CASES: StemSortCase[] = [
  {
    a: 'Undo a percentage change',
    b: 'Find a percentage change',
    aStems: [
      'A bill is £57.60 after a 20% discount. What was it before?',
      'A town has 8,400 people, 5% more than a decade ago. How many then?',
      'A phone costs £216 including 20% tax. What is the price before tax?',
    ],
    bStems: [
      'A bill was £72 and is now £57.60. By what percentage did it fall?',
      'A town had 8,000 people and now has 8,400. What is the rise?',
      'A phone was £180 and is now £216. By what percentage did it rise?',
    ],
    why: 'Every stem mentions a percentage and a price or a population. The deciding feature is which number you are given: the amount after the change, or both amounts.',
  },
  {
    a: 'Add the rates',
    b: 'Divide to get one rate',
    aStems: [
      'Two pumps would empty a tank in 9 and 18 minutes alone. Together?',
      'Three volunteers stuff envelopes at 40, 50 and 60 an hour. Together?',
      'Two printers alone would take 2 hours and 3 hours. Together?',
    ],
    bStems: [
      'A pump empties 240 litres in 8 minutes. How many litres a minute?',
      'A volunteer stuffs 275 envelopes in 5 hours. How many an hour?',
      'A printer produces 480 pages in 6 minutes. How many a minute?',
    ],
    why: 'All six are about pumps, envelopes and printers. Two rates acting at once is a different method from one rate being measured, and the giveaway is whether the problem names more than one worker.',
  },
  {
    a: 'Multiply the choices',
    b: 'Take one minus the chance of none',
    aStems: [
      'A menu has 4 starters, 6 mains and 3 puddings. How many meals?',
      'A lock has 3 dials with 8 positions each. How many settings?',
      'A shirt comes in 5 colours and 4 sizes. How many versions?',
    ],
    bStems: [
      'A bulb fails on 1 night in 30. Over 10 nights, chance of any failure?',
      'A seed germinates 4 times in 5. Of 6 planted, chance any fails?',
      'A train is late 1 day in 8. Over 5 days, chance of any lateness?',
    ],
    why: 'Counting how many things exist and working out how likely at least one event is are different jobs. The phrase "how many" against "what is the chance" separates them in every one of these.',
  },
  {
    a: 'Compare the centres',
    b: 'Compare the spreads',
    aStems: [
      'Which of the two classes scored higher on the whole?',
      'Which delivery service is typically faster door to door?',
      'Which machine produces the greater average output per shift?',
    ],
    bStems: [
      'Which of the two classes had the more consistent set of scores?',
      'Which delivery service is more predictable from day to day?',
      'Which machine varies more from one shift to the next one?',
    ],
    why: 'The same data answers both, and the same summary answers neither. "Higher", "faster" and "greater" ask about the middle; "consistent", "predictable" and "varies" ask about the spread.',
  },
  {
    a: 'Scale by a ratio',
    b: 'Solve for an unknown',
    aStems: [
      'A map uses 2 cm to 5 km. How far is a 7 cm gap in real life?',
      'A paint mix uses 3 parts blue to 2 white. How much white for 12 blue?',
      'A recipe for 4 uses 320 g of flour. How much for 10 people?',
    ],
    bStems: [
      'Two numbers differ by 7 and add to 33. What are they?',
      'A rectangle is twice as long as it is wide and has perimeter 42. Find it.',
      'Three consecutive whole numbers add to 96. What is the smallest?',
    ],
    why: 'Both look like "find the missing number". Scaling needs a fixed relationship between two quantities that grow together; an equation is what you need when a relationship links two unknowns to one total.',
  },
  {
    a: 'Use the right-angle relationship',
    b: 'Use the angle facts',
    aStems: [
      'A right triangle has legs 9 and 12. How long is the third side?',
      'A ramp rises 1.5 m over a 3.6 m base. How long is its surface?',
      'A rectangle is 8 by 15. How long is its diagonal?',
    ],
    bStems: [
      'Two angles of a triangle are 47° and 68°. What is the third?',
      'A straight line is split into angles of 3x and 2x. Find x.',
      'Two parallel lines are crossed by a third; one angle is 112°. Find its partner.',
    ],
    why: 'Every stem is a triangle or a straight line. Squaring sides needs a right angle and two known lengths; angle facts need angles and give angles back. Neither method can be fed by the other one’s numbers.',
  },
]

const methodSortStems = tpl(
  {
    id: 'md-me-sort-stems',
    name: 'Sort by method, not by subject',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 3,
    variants: STEM_SORT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, STEM_SORT_CASES)
    return {
      title: 'Same subject, two methods',
      prompt: `Six problems, two methods, three of each. Do not solve any of them — sort them by what would be done.\n\n**${c.a}** or **${c.b}**?`,
      answer: classify(
        rng,
        [c.a, c.b],
        [...c.aStems.map((text) => ({ text, category: 0 })), ...c.bStems.map((text) => ({ text, category: 1 }))],
      ),
      hints: [
        'For each one, write a single line with no nouns in it: what is given, what is wanted.',
        'Then check which method the given numbers can actually feed. Half of these give you the wrong ingredients for the other method.',
        `The deciding feature in this set: ${c.why.split('.')[1] ?? c.why}`,
      ],
      explanation: `**${c.a}:** ${c.aStems.join(' | ')}\n\n**${c.b}:** ${c.bStems.join(' | ')}\n\n${c.why}\n\nAll six problems share a subject on purpose. Grouping by subject is the default because most remindings arrive by surface — people are reminded of the last problem about pumps, not the last problem with two rates in it — so a sort that agrees with the subject would measure nothing.`,
    }
  },
)

/**
 * Which words in the problem are load-bearing? Method selection is really a
 * reading skill, and this is the reading practised directly: mark the phrases
 * that would change the working if they changed, and leave the scenery alone.
 */
interface CueCase {
  problem: string
  cues: string[]
  scenery: string[]
  why: string
}

const CUE_CASES: CueCase[] = [
  {
    problem:
      'A gardener has 18 m of fencing for a rectangular bed against a wall, using the wall as one side. What dimensions give the largest area?',
    cues: [
      '"against a wall", so only three sides are fenced',
      '"largest area", so this is an optimisation rather than a calculation',
      '"rectangular", which fixes the relationship between the sides',
    ],
    scenery: [
      '"gardener", which tells you who is doing it',
      '"18 m", which is a value rather than a structural feature',
      '"bed", which names what the shape is for',
    ],
    why: 'Change the wall to a fourth fence and the whole setup changes. Change the gardener to a farmer and nothing does. The 18 is genuinely needed for the arithmetic and it does not choose the method — swap it for 24 and you do exactly the same thing.',
  },
  {
    problem:
      'Two dice are rolled. What is the chance that the total is 9, given that one of them shows a 4?',
    cues: [
      '"given that", which restricts the outcomes you are counting from',
      '"the total is 9", which asks about a combination rather than one die',
      '"two dice", which makes the outcomes pairs rather than single numbers',
    ],
    scenery: [
      '"dice", rather than coins or cards or spinners',
      '"a 4", which is a particular value on the face',
      '"rolled", which describes how the outcome is produced',
    ],
    why: '"Given that" is the word that turns this into a conditional problem and shrinks the denominator. The 4 matters to the arithmetic but the METHOD would be identical for a 3 or a 5.',
  },
  {
    problem:
      'A cyclist rides 30 km at a steady speed. If she had ridden 5 km/h faster, the trip would have taken half an hour less. Find her speed.',
    cues: [
      '"steady speed", which lets one relationship cover the whole ride',
      '"half an hour less", which links two journey times together',
      '"if she had", which sets up a second scenario to compare',
    ],
    scenery: [
      '"cyclist", rather than a runner or a driver',
      '"30 km", which is a value rather than a structural feature',
      '"faster", which names the direction of the change',
    ],
    why: 'The comparison between a real journey and a hypothetical one is what forces two expressions and an equation. Without "if she had", this would be a single division.',
  },
  {
    problem:
      'A bag holds red and blue counters in the ratio 5 : 3. After 12 red ones are removed, the ratio is 1 : 1. How many blue counters are there?',
    cues: [
      '"in the ratio 5 : 3", which fixes the relationship rather than the counts',
      '"after 12 red ones are removed", which changes only one of the two groups',
      '"the ratio is 1 : 1", which gives a second relationship to pair with the first',
    ],
    scenery: [
      '"counters", rather than marbles or beads or tokens',
      '"red and blue", which name the two groups',
      '"bag", which is where the counters happen to be kept',
    ],
    why: 'Two ratios before and after a one-sided change is the whole structure. A single ratio would need only scaling; it is the second one that forces an unknown.',
  },
  {
    problem:
      'A shop sells 240 loaves on Monday, 15% fewer on Tuesday, and then 15% more than Tuesday on Wednesday. How many on Wednesday?',
    cues: [
      '"15% fewer" and then "15% more than Tuesday", taken of different amounts',
      '"than Tuesday", which names which amount the second change is taken of',
      'The order of the days, which decides which base each change uses',
    ],
    scenery: [
      '"loaves", rather than any other item being counted',
      '"shop", which names where the selling happens',
      '"240", which is a value rather than a structural feature',
    ],
    why: 'The phrase "than Tuesday" is the entire problem. Without it, a reader assumes both changes are taken of Monday and gets an answer that is out by a noticeable margin.',
  },
  {
    problem:
      'A survey of people leaving a gym found that 82% exercise at least three times a week. The report concludes that most people in the town exercise regularly.',
    cues: [
      '"leaving a gym", which decides who could appear in the sample',
      '"most people in the town", which is a much wider group than the one asked',
      '"concludes", which is where the reasoning step happens',
    ],
    scenery: [
      '"82%", which is a value rather than a structural feature',
      '"three times a week", which sets the threshold being counted',
      '"survey", which names the method of collection',
    ],
    why: 'Where the sample was taken and who the conclusion is about are the two load-bearing phrases, and the gap between them is the fault. The 82% could be any number at all and the objection would be unchanged.',
  },
]

const methodCues = tpl(
  {
    id: 'md-me-cues',
    name: 'Which words choose the method?',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 3,
    variants: CUE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, CUE_CASES)
    return {
      title: 'Load-bearing words',
      prompt: `**Problem.** ${c.problem}\n\nSelect every phrase that would change what you DO if it changed. Leave the ones that would only change the story.`,
      answer: multi(rng, [...c.cues], [...c.scenery]),
      hints: [
        'Take one phrase at a time and imagine it different. Does the working change, or only the wording?',
        'Names, materials, places and units almost never choose a method. Relationships, conditions and comparisons usually do.',
        'A specific number is usually scenery for this purpose: swap it for another number and you would still do the same thing.',
      ],
      explanation: `Load-bearing: ${c.cues.join('; ')}.\n\nScenery: ${c.scenery.join('; ')}. ${c.why}\n\nMethod selection is a reading skill before it is a maths skill. Most people read a problem for its subject, which is why they are reminded of the last problem about dice rather than the last problem with a condition in it — and the fix is exactly this: read once for the structure, and only then decide.`,
    }
  },
)

// =====================================================================
// x-focus — sorting errors by cause, and designing the block
// =====================================================================

const CAUSE_CATEGORIES = [
  'Concept — the idea itself is wrong',
  'Strategy — right ideas, wrong plan',
  'Slip — knew it, ran it wrong',
  'Misread — answered a different question',
]

/**
 * Four causes, not two. The existing error-triage family offers four labels as
 * an MCQ; sorting eight errors at once is a different task, because the labels
 * have to be applied against each other rather than one at a time — which is
 * where the concept/strategy boundary actually gets decided.
 *
 * Sorting by CAUSE rather than by topic is the point: "more practice" only
 * repairs execution, and the other three causes each need something else.
 */
interface CauseCase {
  setting: string
  concept: string[]
  strategy: string[]
  slip: string[]
  misread: string[]
  why: string
}

const CAUSE_CASES: CauseCase[] = [
  {
    setting: 'Eight marks lost across one maths paper.',
    concept: [
      'Wrote that a bigger denominator makes a bigger fraction',
      'Treated 20% off followed by 20% on as cancelling out',
    ],
    strategy: [
      'Solved for the total when the question wanted the difference',
      'Used the area formula on a problem that gives only the perimeter',
    ],
    slip: [
      'Wrote 7 × 8 = 54 in an otherwise perfect solution',
      'Dropped a minus sign when copying the line down the page',
    ],
    misread: [
      'Solved for x when the question asked for 2x',
      'Used 12 cm when the diagram was labelled 12 mm',
    ],
    why: 'The concept errors would repeat on every similar question; the slips would not repeat on the next line, let alone the next question.',
  },
  {
    setting: 'Eight marks lost across one science paper.',
    concept: [
      'Said that heavier objects fall faster because gravity pulls harder',
      'Described a control group as the group that got the weaker treatment',
    ],
    strategy: [
      'Answered with a definition when the question asked for a prediction',
      'Described the method when the question asked what it fails to rule out',
    ],
    slip: [
      'Wrote the right number with the wrong unit beside it',
      'Rounded to two figures halfway through and carried the error on',
    ],
    misread: [
      'Explained the effect of temperature when the question said pressure',
      'Answered about the second experiment while looking at the first table',
    ],
    why: 'Both misreads produce completely correct science about the wrong thing, which is why they never look like knowledge gaps to the person who made them.',
  },
  {
    setting: 'Eight marks lost across one English paper.',
    concept: [
      'Used the word "metaphor" for a straightforward comparison with "like"',
      'Treated the narrator’s opinion as though it were the author’s own view',
    ],
    strategy: [
      'Listed four devices without saying what any of them does to the reader',
      'Wrote about the whole poem when one stanza was quoted',
    ],
    slip: [
      'Wrote the wrong character’s name in an otherwise sound paragraph',
      'Left a quotation unclosed so the sentence ran into the next one',
    ],
    misread: [
      'Analysed language when the question asked about structure',
      'Compared two texts when the question named only one of them',
    ],
    why: 'Listing devices is a strategy fault rather than a knowledge one: the devices were correctly identified and the plan never answered the question.',
  },
  {
    setting: 'Eight marks lost across one programming assignment.',
    concept: [
      'Believed a loop from 0 to n runs n times rather than n plus one',
      'Treated two variables holding the same list as two separate lists',
    ],
    strategy: [
      'Searched the whole list again inside a loop that already had the answer',
      'Solved it by hand for three cases instead of writing the general rule',
    ],
    slip: [
      'Typed a single equals sign where a comparison was meant',
      'Wrote the two arguments in the wrong order in one call',
    ],
    misread: [
      'Returned the position when the task asked for the value',
      'Sorted ascending when the specification said descending',
    ],
    why: 'The two concept errors will produce a wrong answer every time the same structure appears; the typing slips will not survive one careful read.',
  },
  {
    setting: 'Eight marks lost across one history paper.',
    concept: [
      'Described a cause as anything that happened before the event',
      'Treated a source’s date as a measure of how reliable it is',
    ],
    strategy: [
      'Narrated the events in order when the question asked how far one caused another',
      'Gave three examples of one factor and none of the other two',
    ],
    slip: [
      'Wrote 1918 for a date the rest of the paragraph places in 1919',
      'Attributed a quotation to the wrong one of two named figures',
    ],
    misread: [
      'Wrote about the causes when the question asked about the consequences',
      'Answered on the first named country when the question named the second',
    ],
    why: 'Narrating instead of arguing is the commonest strategy fault in essay subjects, and no amount of extra content knowledge repairs it.',
  },
  {
    setting: 'Eight marks lost across one geography paper.',
    concept: [
      'Said that a place with high rainfall must therefore have high humidity all year',
      'Described a pyramid’s wide base as showing a shrinking population',
    ],
    strategy: [
      'Described the map when the question asked what the pattern suggests',
      'Used one case study for a question that asked about a general process',
    ],
    slip: [
      'Read the value off the wrong axis of a correctly drawn graph',
      'Wrote north when the compass on the map points the other way',
    ],
    misread: [
      'Answered about the effects when the question asked about the responses',
      'Wrote about the river’s upper course when the question named the lower',
    ],
    why: 'Reading the wrong axis feels like a data-handling gap and is not: the method was right and the hand went to the wrong place, so a checking habit fixes it rather than more graph work.',
  },
]

const focusCauseSort = tpl(
  {
    id: 'md-fo-cause-sort',
    name: 'File your errors by cause',
    skillIds: ['x-focus'],
    bucket: 'meta',
    difficulty: 3,
    variants: CAUSE_CASES.length,
    minutes: 3.5,
  },
  (rng, seed) => {
    const c = cycle(seed, CAUSE_CASES)
    return {
      title: 'Cause, not topic',
      prompt: `**${c.setting}** Sort each one by what actually went wrong, because the cause is what picks the cure.\n\nConcept: the underlying idea is wrong. Strategy: the ideas are right and the plan does not answer the question. Slip: you know it and your hand did something else. Misread: you answered a question that was not asked.`,
      answer: classify(rng, CAUSE_CATEGORIES, [
        ...c.concept.map((text) => ({ text, category: 0 })),
        ...c.strategy.map((text) => ({ text, category: 1 })),
        ...c.slip.map((text) => ({ text, category: 2 })),
        ...c.misread.map((text) => ({ text, category: 3 })),
      ]),
      hints: [
        'Ask first whether the mechanics were correct inside a wrong plan. If they were, it is strategy rather than concept.',
        'Ask whether it would happen again on the very next question of the same kind. Concept errors repeat; slips do not.',
        'A misread produces perfectly good work about something else. Check what the question actually asked for before blaming knowledge.',
      ],
      explanation: `**Concept:** ${c.concept.join('; ')}.\n**Strategy:** ${c.strategy.join('; ')}.\n**Slip:** ${c.slip.join('; ')}.\n**Misread:** ${c.misread.join('; ')}.\n\n${c.why}\n\nThe reason to file by cause rather than by topic is that the four causes take four different cures, and only one of them is "practise more of this topic". A concept error needs the idea rebuilt; a strategy error needs planning practice on questions of that shape; a slip needs a checking habit; a misread needs a reading ritual. Sorting eight errors into topics tells you where they happened. Sorting them into causes tells you what to do on Tuesday.`,
      transferBridge:
        'The same four causes work on anything that went wrong: a missed deadline, a burnt dinner, an argument. Ask which of the four it was before deciding what to change.',
    }
  },
)

/**
 * Cause in, cure out. Entry point for the skill, because the sorting item
 * above is only worth anything if the four causes lead somewhere different.
 */
interface CureCase {
  diagnosis: string
  key: string
  decoys: string[]
  why: string
}

const CURE_CASES: CureCase[] = [
  {
    diagnosis:
      'You can carry out every step of long division, and on four of five questions you divided when the problem needed multiplying.',
    key: 'Practise choosing the operation without doing any of them',
    decoys: [
      'Do thirty more long division questions this week',
      'Slow down and check each division as you go',
      'Rewrite the method for long division into your notes',
      'Ask for extra help on the long division algorithm you already use',
    ],
    why: 'The execution is fine. What failed is the choice, and drilling execution cannot train a choice — the standard response of "do more practice" would spend the week on the only part that already works.',
  },
  {
    diagnosis:
      'Your algebra is correct every time, and three answers were wrong because 6 × 7 came out as 43 and similar.',
    key: 'Install one habit: substitute the answer back before moving on',
    decoys: [
      'Work through a set of arithmetic drills each morning',
      'Slow the whole paper down and write out every step',
      'Revise the algebra topic again from the beginning',
      'Use a calculator for every single arithmetic step from now onwards',
    ],
    why: 'Isolated arithmetic errors inside correct algebra are slips, and slips are caught rather than trained away. Substituting back catches them in seconds; a general "slow down" costs time on every question to catch a fault on three.',
  },
  {
    diagnosis:
      'You wrote a strong, accurate answer about the causes. The question asked for the consequences.',
    key: 'Underline what is being asked before writing anything',
    decoys: [
      'Learn the consequences as well as the causes for every topic',
      'Write shorter answers so there is time to check them',
      'Plan every essay in bullet points before starting',
      'Read the whole paper through before beginning question one',
    ],
    why: 'Nothing was missing from your knowledge and nothing was wrong with your writing. The repair is a reading ritual at the start, and learning more content would not touch it.',
  },
  {
    diagnosis:
      'You said that a fraction with a bigger denominator is bigger, and it cost marks in three separate questions.',
    key: 'Rebuild the idea with a model you can see, then re-test it',
    decoys: [
      'Practise comparing fractions until the right answers stick',
      'Memorise the rule that a bigger denominator means smaller',
      'Do more of the questions that were marked wrong',
      'Write the rule out at the top of the page in every test',
    ],
    why: 'A wrong idea repeated is a wrong idea rehearsed. Memorising the correct rule on top of the wrong picture leaves the picture in place, which is why it comes back under pressure — the cure has to reach the model, not the sentence.',
  },
  {
    diagnosis:
      'You know both formulas perfectly and used the distance one on a question asking for average speed.',
    key: 'Name the quantity wanted before touching any formula',
    decoys: [
      'Learn both formulas again until they are automatic',
      'Practise more questions on speed and distance',
      'Write both formulas at the top of the exam paper',
      'Check every answer against the units it comes out in',
    ],
    why: 'Knowing formulas and selecting them under pressure are different abilities, and only the second one failed. The unit check is the closest miss here — it would catch the error afterwards, which is worth something, but it does not stop it happening.',
  },
  {
    diagnosis:
      'Your essay listed six devices accurately and never said what any of them does to a reader.',
    key: 'Practise the plan: one device, one effect, one line of evidence',
    decoys: [
      'Learn a wider range of literary devices for next time',
      'Write longer paragraphs so there is space for the effect',
      'Read more model essays before the next assessment',
      'Revise the text again so that the quotations come to mind fresher',
    ],
    why: 'The knowledge is there and the plan does not answer the question. Adding more devices makes the list longer without making it an argument, which is the same error at greater length.',
  },
  {
    diagnosis:
      'Your code is correct and it returns the index of the item when the task asked for the item itself.',
    key: 'Read the required output aloud before writing the return line',
    decoys: [
      'Practise more list-searching problems this week',
      'Add comments explaining what each function returns',
      'Test the function on more inputs before submitting',
      'Learn the standard library functions for searching through lists',
    ],
    why: 'More testing is the tempting answer and it fails here: tests written by the person who misread the task test the wrong behaviour. The repair has to happen at the point where the requirement is read.',
  },
  {
    diagnosis:
      'The same error has now cost you marks on three papers, and each time you understood the correction immediately.',
    key: 'Re-attempt one of that kind cold, a week after the correction',
    decoys: [
      'Read through the corrections again before the next test',
      'Write the correct method out neatly in your notes',
      'Ask the teacher to explain that idea one more time',
      'Do several more questions of that same type straight away afterwards',
    ],
    why: 'Understanding a correction is recognition, and recognition is exactly what has already happened three times without fixing anything. The only evidence the repair took is producing it later with nothing in front of you — which is also why doing several immediately afterwards feels convincing and proves little.',
  },
]

const focusCure = tpl(
  {
    id: 'md-fo-cure',
    name: 'The cause picks the cure',
    skillIds: ['x-focus'],
    bucket: 'meta',
    difficulty: 2,
    variants: CURE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, CURE_CASES)
    return {
      title: 'What would actually fix it',
      prompt: `**What went wrong.** ${c.diagnosis}\n\nWhich repair actually targets it?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Name the cause first: was the idea wrong, the plan wrong, the hand wrong, or the question misread?',
        'Then check which repair touches that cause. "More practice" only ever repairs execution.',
        'A repair that would have caught the error afterwards is worth less than one that stops it happening.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThis is why errors get filed by cause rather than by topic. Filed by topic, every miss says "do more of this topic", which is the right answer roughly a quarter of the time and an expensive way to be wrong the rest of the time.`,
    }
  },
)

/**
 * The third repetition. A recurring error is a different situation from a
 * first one, and the reason is specific: the repair was checked by recognition
 * ("yes, I see") rather than by production, so nothing was ever tested.
 */
interface RecurCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const RECUR_CASES: RecurCase[] = [
  {
    scene:
      'For the third time this term you have expanded brackets and lost the sign on the second term. Each time the correction was obvious the moment you saw it.',
    key: 'Try one cold, a few days later, with nothing in front of you',
    decoys: [
      'Read the correction through more carefully this time',
      'Write out the correct expansion five times over',
      'Highlight the rule about signs in your notes',
      'Do ten more expansions right now, while the correction is fresh',
    ],
    why: 'Three obvious corrections have already happened, and the error survived all three, so a fourth obvious correction predicts a fourth recurrence. The only test the repair has not yet faced is producing it from nothing after a delay.',
  },
  {
    scene:
      'The same spelling has now been corrected in four pieces of work, and you can spell it correctly whenever anyone asks you to.',
    key: 'Find what you write instead, and practise the choice point',
    decoys: [
      'Write the correct spelling out twenty times over',
      'Add it to a list of words to check before handing in',
      'Read more, so the correct form becomes familiar',
      'Ask someone else to proofread every piece of work before it goes in',
    ],
    why: 'Being able to spell it on demand proves the knowledge is there, so the failure is happening at the moment of writing rather than at the moment of knowing. That is where the practice has to land — and the checking list is a reasonable second-best that catches it after the fact rather than preventing it.',
  },
  {
    scene:
      'You have now confused two similar-looking chemical formulas in three tests running, though you can state both correctly when asked directly.',
    key: 'Practise them shuffled together until the choice is the work',
    decoys: [
      'Learn both formulas again until they are automatic',
      'Write the two formulas on a card and read it daily',
      'Do more questions on each of the two compounds',
      'Ask the teacher to explain the difference between them once more',
    ],
    why: 'Stating both correctly on request rules out a knowledge gap: the failure is telling them apart, and telling them apart is exactly what practising them separately never asks you to do.',
  },
  {
    scene:
      'You have run out of time on the last question in three exams in a row, and in each one you knew the material well.',
    key: 'Practise the paper with a clock, and set a per-question limit',
    decoys: [
      'Revise the later topics harder before the next exam',
      'Write faster and shorten the first few answers',
      'Start with the last question in the next exam',
      'Do more past papers first, without timing yourself on any of them',
    ],
    why: 'The recurrence is in the pacing rather than the knowledge, and untimed practice cannot rehearse pacing. Starting with the last question is the tempting answer and it just moves which question runs out of time.',
  },
  {
    scene:
      'The same misreading — solving for x when the question wants 2x — has cost you marks four times, and you spot it instantly when it is pointed out.',
    key: 'Circle the quantity wanted, and check the answer against it',
    decoys: [
      'Slow the whole paper down and take more care throughout',
      'Practise more problems of that particular type',
      'Reread each question twice before starting on it',
      'Write the final answer more clearly at the end of the working',
    ],
    why: 'Four instant recognitions means the knowledge is not the problem. A general instruction to be careful spreads effort evenly over every question to fix a fault that happens at one specific moment; a circle-and-check ritual lands exactly there and costs seconds.',
  },
  {
    scene:
      'You have now lost marks three times for describing a graph rather than interpreting it, and each time you agreed at once with the feedback.',
    key: 'Draft one answer that names the pattern and says nothing else',
    decoys: [
      'Read the mark scheme for that question type again',
      'Learn what interpretation means more precisely',
      'Write longer answers so the interpretation fits in',
      'Look at model answers for several similar questions on this topic',
    ],
    why: 'Agreeing with feedback is recognition again. Writing an answer that is forbidden from describing forces the move that keeps not happening, which reading models does not — reading a model is watching someone else do it.',
  },
  {
    scene:
      'The same off-by-one error has appeared in three of your programs, and each time you found it within a minute of being told it was there.',
    key: 'Write the loop bounds down before writing the loop',
    decoys: [
      'Test each program more thoroughly before submitting it',
      'Read through the loop carefully after writing it',
      'Practise more problems that involve loops and lists',
      'Add comments explaining what the loop is meant to do',
    ],
    why: 'Finding it in a minute when told proves you can see it; the failure is that nothing prompts you to look. Deciding the bounds before writing moves the decision to where the error is made rather than adding another pass over the finished code.',
  },
  {
    scene:
      'You have now been marked down three times for an essay that never states its argument, and each time the feedback made complete sense.',
    key: 'Write the argument in one sentence before the first paragraph',
    decoys: [
      'Plan the essay in more detail before starting to write',
      'Read the question more carefully at the beginning',
      'Read more example essays with strong arguments',
      'Write a longer introduction that covers all of the ideas in turn',
    ],
    why: 'A more detailed plan is the closest miss and it can easily be a more detailed plan of the same shapeless essay. Committing to one sentence is the smallest thing that cannot be done vaguely, which is why it is the repair with teeth.',
  },
]

const focusRecurring = tpl(
  {
    id: 'md-fo-recurring',
    name: 'It came back again',
    skillIds: ['x-focus'],
    bucket: 'meta',
    difficulty: 3,
    variants: RECUR_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, RECUR_CASES)
    return {
      title: 'The third time is different',
      prompt: `${c.scene}\n\nWhat should happen now?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'The phrase "it was obvious once I saw it" is the important part of every one of these.',
        'Ask what has already been tried three times. Whatever it is, it is not the answer.',
        'A repair is only proved by producing the right thing later, with nothing in front of you.',
      ],
      explanation: `${c.key}. ${c.why}\n\nA recurring error has a signature: the correction is understood immediately every time, and the error returns anyway. That is because understanding a correction is recognition, and recognition is far easier than production — so the repair has never actually been tested. It is also why this app re-tests a repaired idea later rather than moving on: a correction that is only ever agreed with is not evidence of anything.`,
      transferBridge:
        'Anywhere a fix keeps not sticking, the same question applies: has this been checked by agreeing with it, or by doing it again from nothing?',
    }
  },
)

/**
 * The work block as an ordering task. No study tests this specific sequence,
 * and the explanation says so; what the ordering encodes is that the two
 * expensive failures are drifting (no named objective) and following an
 * intrusion (no capture list), and both are cheaper to prevent than to fix.
 */
interface BlockCaseOrder {
  setting: string
  steps: string[]
  why: string
}

const BLOCK_ORDER_CASES: BlockCaseOrder[] = [
  {
    setting: 'Fifty minutes for your hardest subject, at a desk, with a phone in the room.',
    steps: [
      'Write down the one thing this block is for, in a single line',
      'Put the phone in another room and get a scrap of paper for stray thoughts',
      'Work, parking every unrelated thought on the scrap without following it',
      'Stop at the time you set, and write the first line of what comes next',
    ],
    why: 'The objective comes first because everything after it is easier to judge once it exists.',
  },
  {
    setting: 'Forty minutes of revision, in a shared room, the evening before a busy day.',
    steps: [
      'Choose the single topic and the way you will check it at the end',
      'Move to the quietest seat available and put the notes face down',
      'Answer from memory first, checking the notes only after each attempt',
      'Mark what you could not produce, and leave it at the top of tomorrow',
    ],
    why: 'Deciding the check in advance is what stops the block quietly becoming an hour of rereading.',
  },
  {
    setting: 'An hour on a long assignment that has been avoided for three days.',
    steps: [
      'Name the smallest piece that would count as real progress today',
      'Close everything not needed for that piece, including the tabs you meant to read',
      'Work on that piece only, writing other tasks on a list as they occur',
      'Finish by leaving one sentence unfinished, so restarting is trivial',
    ],
    why: 'Avoided work is usually work with no defined first piece, so naming one is the actual unblocking move.',
  },
  {
    setting: 'Thirty minutes between two lessons, with a laptop and a noisy corridor.',
    steps: [
      'Pick a task that genuinely fits in thirty minutes and name it',
      'Put on the headphones and open only the one document needed',
      'Work straight through, noting interruptions rather than answering them',
      'Write down exactly where you stopped before packing up',
    ],
    why: 'A task chosen to fit the time is what makes a short block worth starting at all.',
  },
  {
    setting: 'Ninety minutes at the weekend for a subject you find easy to drift in.',
    steps: [
      'Split it into two named halves with a short break planned between them',
      'Set up the desk for the first half only and put the rest out of reach',
      'Work the first half, then take the break away from the desk',
      'Check at the end which half produced more, and note why',
    ],
    why: 'Deciding the break in advance is what stops the break being decided by the first dull moment.',
  },
  {
    setting: 'Forty-five minutes of practice on an instrument, with the phone used as a metronome.',
    steps: [
      'Name the passage and what "better" would sound like by the end',
      'Set the phone to do nothing but keep time, and put it out of reach',
      'Practise slowly, writing down anything that needs looking up later',
      'Play it once at speed, record it, and note what to start with tomorrow',
    ],
    why: 'A tool that is also a distraction has to be given one job before the block starts, not during it.',
  },
]

const focusBlockOrder = tpl(
  {
    id: 'md-fo-block-order',
    name: 'Build the work block',
    skillIds: ['x-focus'],
    bucket: 'meta',
    difficulty: 2,
    variants: BLOCK_ORDER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, BLOCK_ORDER_CASES)
    return {
      title: 'Four moves, in order',
      prompt: `**The block.** ${c.setting}\n\nPut these four moves into the order that gives the block the best chance.`,
      answer: ordered(rng, c.steps),
      hints: [
        'Everything that can be decided before you start should be decided before you start.',
        'Changing the room and the tools beats deciding to concentrate harder.',
        'The last move exists so that starting next time is cheap. Do not leave it out of the order.',
      ],
      explanation: `The order is:\n1. ${c.steps[0]}\n2. ${c.steps[1]}\n3. ${c.steps[2]}\n4. ${c.steps[3]}\n\n${c.why} The two expensive failures in a work block are drifting, which a named objective prevents, and following a stray thought, which a scrap of paper prevents — a thought written down stops competing for attention without being acted on. Ending deliberately matters for the next block rather than this one: restarting from a known point is far cheaper than restarting from nothing.\n\nHonestly stated: no study tests this exact four-step sequence. What is behind it is that interruptions cost their own length plus the time to get back, and that changing the environment is more reliable than deciding to resist it. The order is a sensible arrangement of those two facts, not a finding.`,
    }
  },
)

/**
 * Planning a block is arithmetic before it is willpower, and people are bad at
 * it in a specific direction: they plan the work and forget the overheads, so
 * the block ends with the checking stage unstarted. The numbers here are
 * chosen so the answer is a whole number of items.
 */
const BUDGET_PARAMS: {
  minutes: number
  setup: number
  review: number
  each: number
  unit: string
  task: string
}[] = [
  { minutes: 50, setup: 5, review: 9, each: 6, unit: 'problems', task: 'algebra problems' },
  { minutes: 60, setup: 6, review: 10, each: 8, unit: 'questions', task: 'past-paper questions' },
  { minutes: 45, setup: 4, review: 8, each: 11, unit: 'passages', task: 'translation passages' },
  { minutes: 40, setup: 5, review: 7, each: 4, unit: 'cards', task: 'sets of flashcards' },
  { minutes: 75, setup: 8, review: 12, each: 11, unit: 'proofs', task: 'geometry proofs' },
  { minutes: 30, setup: 3, review: 6, each: 7, unit: 'exercises', task: 'coding exercises' },
  { minutes: 90, setup: 10, review: 14, each: 11, unit: 'essays', task: 'timed essay plans' },
  { minutes: 55, setup: 5, review: 8, each: 7, unit: 'diagrams', task: 'labelled diagrams' },
]

const focusBudget = tpl(
  {
    id: 'md-fo-budget',
    name: 'What actually fits in the block',
    skillIds: ['x-focus'],
    bucket: 'meta',
    difficulty: 3,
    variants: BUDGET_PARAMS.length,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const p = cycle(seed, BUDGET_PARAMS)
    const working = p.minutes - p.setup - p.review
    const fits = Math.floor(working / p.each)
    return {
      title: 'Plan it with the overheads in',
      prompt: `A block of **${p.minutes} minutes** on ${p.task}.\n\nYou will spend **${p.setup} minutes** at the start naming the objective and clearing the desk, and keep **${p.review} minutes** at the end to go back over what went wrong. Each one takes about **${p.each} minutes**.\n\nHow many ${p.unit} actually fit? (Whole number only.)`,
      answer: numeric(fits),
      hints: [
        'Take the overheads off the total first. They are not optional — the block only works if they happen.',
        `That leaves ${p.minutes} − ${p.setup} − ${p.review} minutes of actual work.`,
        `Worked path: ${working} ÷ ${p.each} is ${(working / p.each).toFixed(1)}, and a part-finished one does not count, so **${fits}**.`,
      ],
      explanation: `${p.minutes} − ${p.setup} − ${p.review} = ${working} minutes of work, and ${working} ÷ ${p.each} gives **${fits}** complete ${p.unit}.\n\nThe number is usually smaller than people expect, and the reason matters. A plan built by dividing ${p.minutes} by ${p.each} would claim ${Math.floor(p.minutes / p.each)}, and the block would end with the review stage never started — which is the stage that turns the work into something you learn from. Planning the overheads in is what stops "I will check my mistakes at the end" from being the thing that gets dropped every single time.\n\nThe honest caveat: ${p.each} minutes each is an estimate, and estimates made from the inside run short. If your record says these take longer, use your record.`,
      transferBridge:
        'The same arithmetic works on any plan with a fixed end: take off what must happen at both ends first, and divide what is left.',
    }
  },
)

// =====================================================================
// x-calib — matching confidence to evidence
// =====================================================================

/**
 * Confidence is a claim about how often you are right, so it has to be
 * answerable by the evidence you actually hold. Every case names the evidence
 * explicitly, which turns "how sure are you?" into a question with a checkable
 * answer rather than a mood reading.
 */
interface EvidenceCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const EVIDENCE_CASES: EvidenceCase[] = [
  {
    scene:
      'You have solved this exact type of equation twelve times this month and got eleven right, all unaided.',
    key: 'Around 90% — the record is the number',
    decoys: [
      'Around 100%, since you understand the method properly now',
      'Around 50%, because being sure about your own work is risky',
      'Around 70%, to leave yourself some room in case of an error',
      'No number can be given here',
    ],
    why: 'Eleven out of twelve is a rate, and it is the best estimate available for the next one of the same kind. Rounding down "to be safe" is not caution, it is a worse forecast — and forecasts that are never wrong in the safe direction are still wrong.',
  },
  {
    scene:
      'You have never seen this question type before. You worked out an answer that seems to make sense and you cannot check it.',
    key: 'Low, and worth saying out loud',
    decoys: [
      'High, because the answer came out neatly and looked right',
      'Around 50%, since it either is correct or it is not correct',
      'High, because the method you used has worked elsewhere before',
      'Impossible to say anything',
    ],
    why: 'A neat-looking answer on an unfamiliar type is exactly the situation that produces confident errors. The 50% option is worth naming: "it is either right or wrong" is not a probability, it is a description of the two outcomes, and it would give 50% to everything.',
  },
  {
    scene:
      'You got this idea right twice today, both times after taking a hint, and you have not tried one unaided.',
    key: 'Moderate at best, and the hints are why',
    decoys: [
      'High, since two correct answers in a row is a good sign',
      'High, because the hints only nudged you in the right direction',
      'Low — a hint proves nothing',
      'Around 50%, because two attempts is far too few to say anything',
    ],
    why: 'Hinted successes are real evidence and they are evidence about a different thing: performing with support. The last option overcorrects — two attempts is thin but it is not nothing, and "too few to say anything" would leave you with no estimate at all when a cautious one is available.',
  },
  {
    scene:
      'You learned this three weeks ago, got it right consistently at the time, and have not touched it since.',
    key: 'Lower than it was, because of the gap',
    decoys: [
      'The same as it was, since you learned it properly at the time',
      'Higher than it was, because time lets material settle in memory',
      'Very low, since three weeks means it will all have gone by now',
      'Unknowable after a gap',
    ],
    why: 'Forgetting is fast at first and then slows, so three weeks costs something real and rarely everything. The "settled in memory" option is a common belief with nothing behind it, and the "unknowable" one gives up on an estimate you can improve for free by attempting one question.',
  },
  {
    scene:
      'Four people you asked all said the same thing, and all four heard it from the same teacher.',
    key: 'One source, so treat it as one',
    decoys: [
      'Four independent agreements, which is fairly strong evidence',
      'Stronger than one source, because four people all remembered it',
      'Weak, because things always change as they get passed along',
      'Not judgeable without the teacher',
    ],
    why: 'Agreement only adds confidence when the agreeing parties could have disagreed. Four repetitions of one source is one piece of evidence heard four times, which feels like corroboration and is not.',
  },
  {
    scene:
      'You have attempted this skill four times: right, right, wrong, right.',
    key: 'Roughly three in four, and the sample is thin',
    decoys: [
      'Around 100%, since the only wrong one was a careless mistake',
      'Around 50%, because the results have gone both ways so far',
      'No estimate is possible from as few as four attempts',
      'Around 90%, because the most recent attempt was a correct one',
    ],
    why: 'Three in four is the honest reading and four attempts is genuinely thin, so both halves belong in the answer. Explaining away the wrong one as careless is how a record gets quietly rewritten; the most recent result on its own is one attempt wearing the authority of four.',
  },
  {
    scene:
      'You can explain the idea fluently to a friend and have not attempted a problem on it.',
    key: 'Not settled — explaining and doing are different',
    decoys: [
      'High, since explaining something is the strongest test there is',
      'High, because you could not explain it without understanding it',
      'Low — explaining is always easier',
      'Around 50%, since there is genuinely no information either way',
    ],
    why: 'A fluent explanation is real evidence about the explanation and does not settle whether the method runs on a problem you have not seen. The third option pushes too far the other way: explanations are not worthless, they are just evidence about a different thing.',
  },
  {
    scene:
      'Your last twenty answers in this topic were right, and every one of them was the same question type.',
    key: 'High for that type, and untested beyond it',
    decoys: [
      'High across the whole topic, since twenty in a row is a lot',
      'Low, because twenty of one type is not really practice at all',
      'High — a run that long is not luck',
      'Around 50% for anything you have not been asked yet at all',
    ],
    why: 'Twenty of one type supports a strong claim about that type and no claim at all about the rest of the topic — which is the shape of most overconfidence: a real record, generalised past what it covers.',
  },
]

const calibEvidenceMatch = tpl(
  {
    id: 'md-ca-evidence-match',
    name: 'How sure does the evidence allow?',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 3,
    variants: EVIDENCE_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, EVIDENCE_CASES)
    return {
      title: 'Confidence is a claim about frequency',
      prompt: `${c.scene}\n\nHow confident does that evidence entitle you to be?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Read a confidence as a prediction: out of a hundred situations like this one, how many would come out right?',
        'Then ask what your evidence is actually a record of, and whether this situation is one of those.',
        '"It is either right or wrong, so 50%" is not a probability. It would give 50% to absolutely everything.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThe habit underneath all eight of these is the same: before choosing a number, say what the number is a claim about. A confidence is a rate — how often you would be right across situations like this one — which makes it checkable afterwards, and checkable is the only kind of confidence worth stating.`,
    }
  },
)

/**
 * "I do not know" as a correct answer. Every skill in this app has a branch
 * that refuses to produce a number when the evidence is too thin; this is that
 * rule, taught to the learner instead of only enforced on their behalf.
 */
interface DontKnowCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const DONT_KNOW_CASES: DontKnowCase[] = [
  {
    scene:
      'A friend asks which of two revision apps is better. You have used one of them, for two days, last year.',
    key: '"I do not know — I have only used one"',
    decoys: [
      'Recommend the one you tried',
      'Recommend the other one, because yours did not stick with you',
      'Say they are probably much the same as one another',
      'Give an opinion and mention that you only used it briefly',
    ],
    why: 'The last option is the closest miss and worth being careful about: a hedge attached to an answer still transmits the answer, and people remember the recommendation rather than the caveat. Having tried one of two things is not a comparison.',
  },
  {
    scene:
      'A teacher asks whether you understand, and you follow the words without being able to say what to do first.',
    key: '"Not yet — I could not start one on my own"',
    decoys: [
      'Say yes, since the explanation did make sense while it was happening',
      'Say yes, and work it out properly later on your own time',
      'Say nothing, since the lesson has moved on already',
      'Say you understand most of it and will ask if it goes wrong',
    ],
    why: 'Following an explanation is recognition and starting one is production, and the question is really about the second. Saying yes here is the single cheapest way to lose the help that is standing in front of you.',
  },
  {
    scene:
      'A quiz asks a factual question you have never met. You can eliminate two of four options.',
    key: 'Answer, at about one in two',
    decoys: [
      'Say you do not know, since you have never met the fact',
      'Answer, and say you are fairly confident about it',
      'Say you do not know, because a guess is not real knowledge',
      'Answer, and treat it as certain',
    ],
    why: 'This is the case where "I do not know" is the WRONG answer, and it is in the set for that reason. Eliminating two options is real information, and refusing to use it is not modesty — it throws away a genuine improvement from one in four to one in two. Honesty is about the confidence you attach, not about refusing to answer.',
  },
  {
    scene:
      'Someone asks what a word in a text means. You have a strong feeling about it and have never looked it up.',
    key: '"I think so, but I have not checked"',
    decoys: [
      'Give the meaning, since the feeling is a strong one',
      'Say you do not know',
      'Give the meaning and say it is definitely right',
      'Give the meaning and change the subject quickly',
    ],
    why: 'A strong feeling about a word is worth stating and is not worth stating as fact. The refusal is the other error: you do have information and withholding it is not more honest, it is less.',
  },
  {
    scene:
      'You are asked to predict your mark on a paper covering four topics, of which you have practised one.',
    key: '"I can predict one topic, not the paper"',
    decoys: [
      'Predict a mark based on how the practised topic went',
      'Predict a low mark, since three of the four are unpractised',
      'Refuse to predict anything',
      'Predict your usual mark, since papers tend to come out similar',
    ],
    why: 'The honest move is to say exactly how far the evidence reaches rather than to answer or refuse wholesale. The last option is the interesting trap: your usual mark is a reference class and it is the wrong one, because the usual paper was not three-quarters unpractised.',
  },
  {
    scene:
      'A group is deciding something and everyone else seems certain. You have no information either way.',
    key: '"I have no basis for a view on this"',
    decoys: [
      'Agree with the group, since everyone else seems confident',
      'Disagree, to test the decision',
      'Say you agree but privately keep your doubts to yourself',
      'Ask a question that implies a view you do not actually hold',
    ],
    why: 'Adding an empty vote makes the group look more agreed than it is, which is how confident wrong decisions get made. Disagreeing on purpose is the mirror-image fault and manufactures information just as fake.',
  },
  {
    scene:
      'You are asked whether a study you skim-read supports a claim. You read the headline and the first paragraph.',
    key: '"I have not read enough of it to say"',
    decoys: [
      'Say it supports the claim, since the headline said so',
      'Say it does not — headlines overstate',
      'Say it supports the claim with some reservations',
      'Say studies of that kind generally support that claim',
    ],
    why: 'The second option is the sceptic\'s version of the same error: a rule about headlines is not a reading of this study. Every one of the four answers claims to know something about a document you have not read.',
  },
  {
    scene:
      'Someone asks you to explain why a rule works. You can use it correctly every time and have never known why.',
    key: '"I can use it — I do not know why it works"',
    decoys: [
      'Explain it in terms of the rule itself, which is what you know',
      'Say the rule is simply that way',
      'Give a plausible reason and see whether they accept it',
      'Say you learned it too long ago to remember the reasoning',
    ],
    why: 'The distinction between using and explaining is exactly the thing being asked about, and naming it is the useful answer. Restating the rule as its own reason is the commonest false explanation there is, and inventing a plausible reason is worse — it may be right, and you would not know.',
  },
]

const calibDontKnow = tpl(
  {
    id: 'md-ca-dont-know',
    name: 'When "I do not know" is right',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 2,
    variants: DONT_KNOW_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, DONT_KNOW_CASES)
    return {
      title: 'Saying how far you can see',
      prompt: `${c.scene}\n\nWhat is the honest answer?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what you would have to have seen to answer this, and whether you have seen it.',
        'Then check the opposite error: refusing to answer when you do hold real information is not honesty either.',
        'The best answers usually say exactly how far the evidence reaches, rather than answering or refusing outright.',
      ],
      explanation: `${c.key}. ${c.why}\n\n"I do not know" is a skill with two failure modes, like every other kind of help-seeking. Saying it too rarely produces confident nonsense; saying it too often throws away information you actually have. One of the eight cases in this set has "answer anyway" as the key for exactly that reason — a bank where the honest move was always to refuse would be teaching a different bad habit.`,
    }
  },
)

/**
 * Reading your own record as arithmetic. Stated confidence is a prediction
 * about a rate, so the check is a rate — and the gap between the two is the
 * only thing calibration ever measures.
 */
const RECORD_PARAMS: { stated: number; n: number; right: number; topic: string }[] = [
  { stated: 90, n: 40, right: 26, topic: 'percentage questions' },
  { stated: 70, n: 20, right: 17, topic: 'graph-reading questions' },
  { stated: 60, n: 25, right: 12, topic: 'ratio questions' },
  { stated: 80, n: 50, right: 34, topic: 'equation questions' },
  { stated: 50, n: 30, right: 21, topic: 'probability questions' },
  { stated: 95, n: 20, right: 13, topic: 'unit-conversion questions' },
  { stated: 75, n: 60, right: 45, topic: 'geometry questions' },
  { stated: 65, n: 40, right: 26, topic: 'data questions' },
]

const calibTrackRecord = tpl(
  {
    id: 'md-ca-track-record',
    name: 'Read your own record',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 2,
    variants: RECORD_PARAMS.length,
    minutes: 2.5,
    calibration: true,
  },
  (_rng, seed) => {
    const p = cycle(seed, RECORD_PARAMS)
    const actual = Math.round((p.right / p.n) * 100)
    const gap = actual - p.stated
    const verdict =
      gap <= -10
        ? `You are overconfident here: your stated ${p.stated}% should be read as roughly ${actual}%.`
        : gap >= 10
          ? `You are underconfident here: you know this better than you are claiming, so your ${p.stated}% is really about ${actual}%.`
          : 'That is well calibrated — the number you state and the rate you achieve agree.'
    return {
      title: 'Stated against achieved',
      prompt: `On **${p.n} ${p.topic}** you said you were **${p.stated}% sure** every time. You got **${p.right}** of them right.\n\nWhat percentage were you actually right? (Number only, no per cent sign.)`,
      answer: numeric(actual),
      hints: [
        'A confidence is a prediction about how often you will be right, so check it the same way: right ones out of total.',
        `That is ${p.right} out of ${p.n}.`,
        `Worked path: ${p.right} ÷ ${p.n} = ${(p.right / p.n).toFixed(2)}, which is **${actual}%**.`,
      ],
      explanation: `${p.right} ÷ ${p.n} = ${actual}%, against a stated ${p.stated}%. ${verdict}\n\nCalibration is only ever this comparison, and both directions are real faults. Overconfidence costs you the chance to fix things you believe you have; underconfidence costs you time re-studying material you already own, and it makes you hesitate on answers you would have got right. Neither is modesty and neither is arrogance — they are both just a number that does not match a rate.\n\nOne limit worth keeping: ${p.n} attempts is enough to see a gap this size, and a handful would not be. A rate from three or four attempts is mostly noise, which is why this app hides calibration bands until enough attempts exist to say anything.`,
    }
  },
)

/**
 * Sorting records rather than judging one. A single record can be read as a
 * story; six at once force the same rule to be applied to all of them, which
 * is where "but that one was careless" stops working.
 */
interface RecordSortCase {
  setting: string
  over: string[]
  fine: string[]
  under: string[]
  why: string
}

const RECORD_SORT_CASES: RecordSortCase[] = [
  {
    setting: 'Six months of your own confidence ratings, by topic.',
    over: ['Said 90% on 30 questions, right on 18', 'Said 80% on 40 questions, right on 22'],
    fine: ['Said 70% on 50 questions, right on 36', 'Said 60% on 30 questions, right on 19'],
    under: ['Said 50% on 40 questions, right on 31', 'Said 65% on 20 questions, right on 18'],
    why: 'The rule is the same in all six: the stated number is a prediction, and the achieved rate either matches it or does not.',
  },
  {
    setting: 'A study group comparing their own records.',
    over: ['Said 95% on 20 questions, right on 12', 'Said 75% on 60 questions, right on 33'],
    fine: ['Said 80% on 25 questions, right on 20', 'Said 50% on 40 questions, right on 21'],
    under: ['Said 40% on 30 questions, right on 21', 'Said 70% on 40 questions, right on 36'],
    why: 'Notice that a low stated confidence can still be overconfident and a high one can still be about right. The number on its own says nothing.',
  },
  {
    setting: 'Your record split by how the question was answered.',
    over: ['Said 85% after taking a hint, right on 14 of 30', 'Said 90% on rushed answers, right on 21 of 40'],
    fine: ['Said 60% on unaided attempts, right on 18 of 30', 'Said 75% on reviewed topics, right on 30 of 40'],
    under: ['Said 45% on hard questions, right on 24 of 40', 'Said 55% on new topics, right on 22 of 30'],
    why: 'The overconfidence lives where the conditions were unusual — after a hint, or in a hurry — which is exactly where confidence is formed from something other than a record.',
  },
  {
    setting: 'A term of forecasts about how tasks would go.',
    over: ['Said 90% these would be done on time, 12 of 20 were', 'Said 80% these would take an hour, 9 of 25 did'],
    fine: ['Said 50% these would need a second attempt, 11 of 20 did', 'Said 70% these would be marked well, 21 of 30 were'],
    under: ['Said 30% these would be finished early, 12 of 25 were', 'Said 60% these would be easy, 24 of 30 were'],
    why: 'Predictions about your own future work are where overconfidence is most reliable, because the plan is vivid and the interruptions are not.',
  },
  {
    setting: 'Confidence ratings split by how recently the topic was studied.',
    over: ['Said 85% on topics from last term, right on 13 of 30', 'Said 90% just after reading, right on 20 of 40'],
    fine: ['Said 70% a week after study, right on 21 of 30', 'Said 55% on older topics, right on 22 of 40'],
    under: ['Said 40% on topics thought forgotten, right on 21 of 30', 'Said 50% before revising, right on 26 of 40'],
    why: 'A rating made immediately after reading is the classic overconfident one: everything is in mind at that exact moment and nothing about the moment resembles the test.',
  },
  {
    setting: 'Confidence ratings from six different subjects.',
    over: ['Said 90% in the strongest subject, right on 19 of 30', 'Said 70% in a favourite subject, right on 16 of 40'],
    fine: ['Said 60% in a middling subject, right on 25 of 40', 'Said 80% in a well-drilled subject, right on 24 of 30'],
    under: ['Said 35% in a disliked subject, right on 17 of 30', 'Said 50% in a feared subject, right on 26 of 40'],
    why: 'Liking a subject and being right in it are different measurements, and this is the pattern that shows it: the favourite subject is where the gap is widest in one direction and the feared one where it is widest in the other.',
  },
]

const calibSortRecords = tpl(
  {
    id: 'md-ca-sort-records',
    name: 'Sort the records',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 3,
    variants: RECORD_SORT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, RECORD_SORT_CASES)
    return {
      title: 'Six records, one rule',
      prompt: `**${c.setting}** For each line, work out the rate actually achieved and compare it with the number that was stated.\n\nCount anything within about ten points either way as calibrated.`,
      answer: classify(
        rng,
        ['Overconfident', 'About right', 'Underconfident'],
        [
          ...c.over.map((text) => ({ text, category: 0 })),
          ...c.fine.map((text) => ({ text, category: 1 })),
          ...c.under.map((text) => ({ text, category: 2 })),
        ],
      ),
      hints: [
        'Do the division first on every line, before deciding anything. The stated number is designed to pull your judgement.',
        'A high stated confidence is not automatically overconfidence, and a low one is not automatically caution.',
        'Underconfidence is a real fault with a real cost: it means re-studying things you already own.',
      ],
      explanation: `**Overconfident:** ${c.over.join('; ')}.\n**About right:** ${c.fine.join('; ')}.\n**Underconfident:** ${c.under.join('; ')}.\n\n${c.why}\n\nDoing the arithmetic before judging is the whole method, because the stated number is the thing being tested and reading it first contaminates the reading. And underconfidence belongs in the sort: leaving it out would teach that the only mistake is claiming too much, which quietly rewards hedging everything to 50% — a number that can never be badly wrong and can never be useful either.`,
    }
  },
)

/**
 * What does the record actually license? The hardest version of the skill, and
 * the one closest to what the app itself does: a record supports a claim about
 * the conditions it was gathered under, and no others.
 */
interface ClaimCase {
  record: string
  supported: string[]
  unsupported: string[]
  why: string
}

const CLAIM_CASES: ClaimCase[] = [
  {
    record: 'Thirty unaided attempts at one question type over three weeks: 24 right.',
    supported: [
      'You are right about four times in five on this question type',
      'The rate held up across three weeks rather than one good day',
    ],
    unsupported: [
      'You are right about four times in five across the whole topic',
      'You would be right four times in five under exam time pressure',
      'You understand why the method works, as well as how to run it',
    ],
    why: 'The record covers one type, unaided, over three weeks. It says nothing about other types, nothing about timed conditions, and nothing about explanation.',
  },
  {
    record: 'Twelve attempts at a skill, all in one evening, all correct, all with the notes open.',
    supported: [
      'You can carry out the method with the notes available',
      'Nothing here shows what happens when the notes are shut',
    ],
    unsupported: [
      'You have learned the method and can produce it from memory',
      'The skill will still be there in a week without any review',
      'Twelve in a row is enough to call it reliable in any conditions',
    ],
    why: 'Every attempt shared two conditions — one evening and open notes — so the record is about performing under those, which is exactly the condition a test will not provide.',
  },
  {
    record: 'Forty questions across four topics: 30 right, but 18 of the 20 in one topic.',
    supported: [
      'You are strong in the topic that supplied twenty of the questions',
      'The overall figure of 30 out of 40 hides a wide split',
    ],
    unsupported: [
      'You are right about three times in four in every one of the four topics',
      'The four topics are at a similar level for you at the moment',
      'A single figure of 75% is a fair summary of where you are',
    ],
    why: 'Averaging across unevenly sampled groups produces a number that describes none of them. Twelve of the other twenty were right, which is a different skill level entirely.',
  },
  {
    record: 'Twenty attempts at a topic: 15 right, and 11 of the 15 came after a hint.',
    supported: [
      'You can reach the answer with support most of the time',
      'Only four attempts show the method running unaided',
    ],
    unsupported: [
      'You are right three times in four on this topic on your own',
      'The hints made no real difference to the outcomes here',
      'Fifteen correct attempts is enough to call the topic secure',
    ],
    why: 'Hinted and unaided results answer different questions, and merging them produces a rate for a condition that was never tested — which is why this app records the two separately rather than adding them up.',
  },
  {
    record: 'Six weeks of daily practice on one skill, with accuracy rising from 40% to 85%.',
    supported: [
      'Your accuracy on this skill rose over the six weeks',
      'The last week is the best evidence of where you are now',
    ],
    unsupported: [
      'The improvement will still be there in three months without practice',
      'Daily practice is what caused the rise rather than anything else',
      'The same rate of improvement would continue for another six weeks',
    ],
    why: 'A rise measured during practice is a rise measured during practice. Whether it survives a gap is a different measurement, and nothing in this record was collected after one.',
  },
  {
    record: 'Fifty questions in one subject: 40 right, all taken from the end-of-chapter sets.',
    supported: [
      'You can run each method when the chapter has named it',
      'Nothing here tests choosing the method for yourself',
    ],
    unsupported: [
      'You would score around 80% on a mixed paper in this subject',
      'You can tell the methods in this subject apart from one another',
      'Eighty per cent is a fair prediction of your exam mark here',
    ],
    why: 'End-of-chapter questions announce the method by where they sit, so the record covers execution and never touches selection — which is most of what a mixed paper actually asks.',
  },
]

const calibSupportedClaims = tpl(
  {
    id: 'md-ca-supported-claims',
    name: 'What does the record license?',
    skillIds: ['x-calib'],
    bucket: 'meta',
    difficulty: 4,
    variants: CLAIM_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, CLAIM_CASES)
    return {
      title: 'How far the evidence reaches',
      prompt: `**The record.** ${c.record}\n\nSelect every claim this record actually supports. Several of the others are probably true and are still not supported by this.`,
      answer: multi(rng, [...c.supported], [...c.unsupported]),
      hints: [
        'List the conditions every attempt shared: which type, with or without help, over how long, under what pressure.',
        'A claim is supported only if the record was gathered under the conditions the claim is about.',
        '"Probably true" and "supported by this evidence" are different verdicts, and the item is asking for the second.',
      ],
      explanation: `Supported: ${c.supported.join('; ')}.\n\nNot supported by this: ${c.unsupported.join('; ')}. ${c.why}\n\nThis is the discipline the app applies to itself. A hinted success is recorded as guided rather than independent, a placement result routes you without proving anything, and confidence bands stay hidden until enough attempts exist — all for the same reason. A record that gets read past its conditions turns into a comfortable number, and a comfortable number is worse than no number, because you act on it.`,
    }
  },
)

// =====================================================================
// x-learn — what works, WHY it works, and what it does not support
// =====================================================================

/**
 * The mechanism, not the slogan. "Test yourself" is already widely known and
 * widely ignored, and the reason it is ignored is that the mechanism is
 * counter-intuitive: the method that feels worse is the one that works, so
 * knowing WHY is what lets a learner override the feeling.
 */
interface MechanismCase {
  question: string
  key: string
  decoys: string[]
  why: string
}

const MECHANISM_CASES: MechanismCase[] = [
  {
    question:
      'Testing yourself beats rereading, even when the rereading takes the same amount of time. What is the actual mechanism?',
    key: 'Producing it from nothing is what the test asks for',
    decoys: [
      'Testing is more interesting, so attention stays higher',
      'Testing takes more effort, and effort always builds memory',
      'Rereading is passive, and passive activities do not build memory at all',
      'Testing covers more of the material in the same length of time',
    ],
    why: 'The second decoy is the important one to refuse: effort is not the mechanism, or a broken pen would help. What retrieval trains is the specific operation an exam demands — generating the material with nothing in front of you — and rereading trains recognising a page instead.',
  },
  {
    question:
      'Rereading a chapter produces a strong feeling of knowing it. What is actually producing that feeling?',
    key: 'The words go by more easily each time',
    decoys: [
      'The material really has gone in more deeply this time round',
      'The second pass fills in the gaps that the first pass left behind',
      'Any repetition builds memory, so the feeling is honestly earned',
      'Familiar text is easier to focus on',
    ],
    why: 'Ease of processing is real and it is not knowledge. The feeling tracks how smoothly the words go past, which improves on every pass whether or not you could produce a single line of it on a blank page.',
  },
  {
    question:
      'Spreading the same six hours of study over three weeks beats using them in one evening. Why?',
    key: 'Each session starts after some forgetting, and undoing it is the work',
    decoys: [
      'Rested attention makes each of the separate sessions more efficient',
      'Sleeping between sessions moves material into long-term memory',
      'Three weeks simply gives the ideas a great deal more time to settle in',
      'Shorter sessions are easier to concentrate through than long ones',
    ],
    why: 'Rest and sleep are real and they are not the mechanism, because the effect appears with gaps far shorter than a night. What does the work is that a gap lets some forgetting happen, so the next session has to reconstruct rather than re-read — which is retrieval again, arriving by a different door.',
  },
  {
    question:
      'A student rereads and rates their learning 9 out of 10. Another self-tests, gets half wrong, and rates it 5. Who does better on a test next week?',
    key: 'The self-tester, whose low rating came from seeing the gaps',
    decoys: [
      'The rereader, since a high rating reflects material that went in',
      'Neither, because both of them spent exactly the same hour on it',
      'The rereader, because the other spent the hour making mistakes',
      'Impossible to say, since study methods work differently for different people',
    ],
    why: 'The ratings measure how the hour felt, and the hour that felt worse practised the thing the test asks for. The last decoy is a version of the learning-styles idea, which has been tested repeatedly and does not hold up.',
  },
  {
    question:
      'Why does trying a problem before being shown the method beat being shown it first?',
    key: 'The attempt shows you what the method is for',
    decoys: [
      'Struggling with something first makes the memory of it stronger',
      'Attempting first means you spend longer with the material overall',
      'Being shown a method first is passive, and passive learning never works',
      'Attempts usually succeed, which builds confidence',
    ],
    why: 'The attempt does not have to succeed, and usually does not — what it does is make the gap visible, so the method arrives as an answer to a question you now have. The first decoy is the "struggle is good for you" version, which is not what the evidence says; the studies compare an order of activities, not an amount of suffering.',
  },
  {
    question:
      'Two students learn the same list. One tests themselves and checks the answers; the other tests themselves and never checks. What is the difference likely to be?',
    key: 'Checking catches the confident wrong answers',
    decoys: [
      'No real difference, because the retrieval is the part that matters',
      'The one who checks does worse, since checking is passive rereading',
      'The one who never checks does better, because they generate more attempts',
      'Checking mainly helps confidence, not memory',
    ],
    why: 'Retrieval without feedback rehearses whatever came out, including wrong answers held confidently — which is the one case where testing yourself can make things worse. The first decoy is the half-remembered version of the finding, and it is exactly half.',
  },
  {
    question:
      'Why is highlighting rated so low in reviews of study techniques?',
    key: 'It marks what matters and makes you produce nothing',
    decoys: [
      'It damages memory by drawing attention to unimportant sentences',
      'Colour distracts from meaning',
      'Most people highlight far too much of the page for it to be useful',
      'It has no effect of any kind, since marking a page changes nothing',
    ],
    why: 'Deciding what is important is a genuine act and it happens once, and after that the page is a page. The last decoy overstates it in the other direction, and the third names a real habit that is not the reason the technique rates low.',
  },
  {
    question:
      'A student says: "I do not have time to test myself, I need to get through the material." What is wrong with the reasoning?',
    key: 'Testing is not extra time, it is the same time spent differently',
    decoys: [
      'Nothing is wrong, if there is genuinely very little time left',
      'Getting through material is important too, so both are needed',
      'Testing is faster than rereading, so it saves time on every topic',
      'Coverage matters more than depth when an exam is close',
    ],
    why: 'The choice is not between testing and covering the material — it is between two ways of spending the same hour, one of which leaves more behind. The third decoy overclaims in the app\'s favour: testing is not reliably faster per page, it is more durable per minute.',
  },
]

const learnWhyRetrieval = tpl(
  {
    id: 'md-le-why-retrieval',
    name: 'Why it works, not just that it does',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 3,
    variants: MECHANISM_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, MECHANISM_CASES)
    return {
      title: 'The mechanism',
      prompt: c.question,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what the method makes you PRODUCE, and compare it with what the test will ask you to produce.',
        'Distrust any explanation whose mechanism is "effort" or "struggle". A broken pen is effortful and buys nothing.',
        'Separate how the studying felt from what could be written on a blank page a week later.',
      ],
      explanation: `${c.key}. ${c.why}\n\nKnowing the mechanism matters more here than in most places, because the correct method feels worse while you use it. "Test yourself" as a rule loses to the feeling of fluency every time; "the feeling comes from the words going by easily, and the exam asks for something else" survives it.`,
    }
  },
)

/**
 * Spacing as arithmetic. Learners underestimate how far out the last review
 * lands when gaps expand, which is why plans quietly collapse into three
 * reviews in the last week.
 */
const SPACING_PARAMS: { gap: number; reviews: number; test: number; topic: string }[] = [
  { gap: 2, reviews: 3, test: 21, topic: 'a vocabulary list' },
  { gap: 1, reviews: 4, test: 20, topic: 'a set of formulas' },
  { gap: 3, reviews: 3, test: 28, topic: 'a history timeline' },
  { gap: 2, reviews: 4, test: 35, topic: 'a biology cycle' },
  { gap: 4, reviews: 2, test: 16, topic: 'a poem for recital' },
  { gap: 1, reviews: 3, test: 10, topic: 'a spelling list' },
  { gap: 5, reviews: 3, test: 40, topic: 'a set of chemical tests' },
  { gap: 3, reviews: 4, test: 50, topic: 'a body of case law' },
]

const learnSpacingPlan = tpl(
  {
    id: 'md-le-spacing-plan',
    name: 'Where the last review lands',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 3,
    variants: SPACING_PARAMS.length,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const p = cycle(seed, SPACING_PARAMS)
    const days: number[] = []
    let g = p.gap
    let day = 0
    for (let i = 0; i < p.reviews; i++) {
      day += g
      days.push(day)
      g *= 2
    }
    const last = days[days.length - 1]
    return {
      title: 'Count the days out',
      prompt: `You learn ${p.topic} on **day 0**. The test is on **day ${p.test}**.\n\nYou plan **${p.reviews} reviews**, with the first after **${p.gap} day${p.gap === 1 ? '' : 's'}** and each gap twice the one before it.\n\nWhich day does the last review fall on? (Number only.)`,
      answer: numeric(last),
      hints: [
        'Write the gaps out first, doubling each time, then add them up as you go.',
        `The gaps here are ${days.map((_, i) => (i === 0 ? p.gap : days[i] - days[i - 1])).join(', ')} days.`,
        `Worked path: the reviews land on days ${days.join(', ')}, so the last is day **${last}**.`,
      ],
      explanation: `The reviews land on days ${days.join(', ')}, so the last one is day **${last}** — ${p.test - last} day${p.test - last === 1 ? '' : 's'} before the test.\n\nDoing the arithmetic is the point. Gaps that double get long fast, and a plan sketched by feel usually ends up with every review crammed into the last few days, which is the arrangement with the strongest feeling of readiness and the weakest retention.\n\nWhat the evidence actually supports, stated carefully: spreading practice out beats massing it, and this is one of the best-replicated findings there is. Whether the gaps should EXPAND rather than stay equal is much less settled — several studies find little difference between the two. So doubling here is a convenient way to spread the reviews across the whole window, not a magic ratio, and any schedule that puts real gaps between sessions captures most of the benefit.`,
    }
  },
)

/**
 * Refusing a plausible claim is part of study science, so it is graded here.
 * The rejected list is taken straight from RESEARCH.md's neuromyth table, and
 * the supported items are mixed in so that "select everything that sounds like
 * a myth" does not score.
 */
interface MythCase {
  scene: string
  unsupported: string[]
  supported: string[]
  why: string
}

const MYTH_CASES: MythCase[] = [
  {
    scene: 'A revision leaflet handed out at school.',
    unsupported: [
      'Find out whether you are a visual or an auditory learner and study that way',
      'Play brain-training games for ten minutes a day to sharpen your thinking',
      'Learn a memory-palace technique — it makes you better at learning in general',
    ],
    supported: [
      'Close the book and write what you remember, then check what you missed',
      'Spread the same total hours across more days instead of fewer',
      'Attempt a problem before reading the worked solution for it',
    ],
    why: 'Matching teaching to a "learning style" has been tested directly and repeatedly and does not improve results. Brain-training games improve the games. Memory techniques genuinely help with lists and do not transfer to reasoning or to school subjects generally.',
  },
  {
    scene: 'An advert for a study app.',
    unsupported: [
      'Our puzzle levels train the thinking skills you use in maths lessons',
      'Chess practice in the app raises attainment across your subjects',
      'Training your working memory here will raise your general ability',
    ],
    supported: [
      'The app quizzes you rather than showing you the material again',
      'It brings each topic back after a gap rather than all at once',
      'It mixes question types that learners commonly confuse',
    ],
    why: 'The three refused claims are the three biggest in the table, and the same pattern breaks all of them: swap a passive control group for an active one and the advantage disappears. The three supported ones describe retrieval, spacing and interleaving, which are the mechanics that do hold up.',
  },
  {
    scene: 'Advice from a well-meaning older student.',
    unsupported: [
      'Harder practice is always better practice, whatever makes it harder',
      'You only really remember something if you write it out several times',
      'Listening to the right music while studying improves how much goes in',
    ],
    supported: [
      'Practice that makes you produce the answer beats practice that shows it to you',
      'A gap between sessions is doing something, even though it feels like a loss',
      'Getting things wrong and correcting them is a normal part of it working',
    ],
    why: 'Difficulty is a side effect of the useful techniques, never the reason they work — a noisy room and a broken pen are difficult and buy nothing. Copying out is production of handwriting rather than of meaning. Background music has been studied a great deal and the results do not support a reliable benefit.',
  },
  {
    scene: 'A social media post about studying.',
    unsupported: [
      'Rewrite your notes in neat colour-coded form and the material sticks better',
      'Watch a video of someone solving problems — it is the same as doing them',
      'If you read something enough times it moves into your long-term memory',
    ],
    supported: [
      'Explaining an idea out loud with the book shut shows you where the gaps are',
      'Answering from a blank page is a better check than recognising a page',
      'Coming back to a topic after a week is worth more than a second pass today',
    ],
    why: 'All three refused items are the fluency illusion in different clothes: they produce a smoother experience of the material and no production of it. Watching someone solve problems is the clearest case, because the watching genuinely feels like learning the whole time.',
  },
  {
    scene: 'A study-skills page in a textbook.',
    unsupported: [
      'Highlighting the key sentences is one of the most effective study methods',
      'Cramming the night before is efficient because everything stays fresh',
      'Some people simply cannot learn from written material and should avoid it',
    ],
    supported: [
      'Self-testing is more useful than rereading even when the time is equal',
      'Practice that mixes confusable question types helps on a mixed test',
      'Feedback after a wrong answer is what stops the wrong answer being rehearsed',
    ],
    why: 'Highlighting rates near the bottom of every large review. Cramming does win a next-morning quiz and loses badly a week later, which is why it survives as a habit. The third is the learning-styles claim in its most damaging form, because it tells someone to avoid a skill they need.',
  },
  {
    scene: 'A conversation about how to get better at thinking.',
    unsupported: [
      'Do logic puzzles regularly and your reasoning improves across the board',
      'Learning a musical instrument raises your general mental ability',
      'Practising memory feats will make school subjects easier to learn',
    ],
    supported: [
      'Comparing two cases that share a structure helps you notice it in a third',
      'Learning to spot which method a problem needs helps on mixed papers',
      'Practising a specific reasoning move can improve that move measurably',
    ],
    why: 'The three refused claims are all far-transfer promises, and far transfer is where the evidence is worst. The supported three are near-transfer claims about specific taught moves, which is the level at which training does show measurable results.',
  },
]

const learnNotSupported = tpl(
  {
    id: 'md-le-not-supported',
    name: 'Which of these does the evidence not support?',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 3,
    variants: MYTH_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, MYTH_CASES)
    return {
      title: 'What the research does not say',
      prompt: `**${c.scene}** Six pieces of advice. Select every one that the evidence does **not** support.`,
      answer: multi(rng, [...c.unsupported], [...c.supported]),
      hints: [
        'Three of the six describe things that make studying feel smoother without making you produce anything.',
        'Be suspicious of any claim that one activity improves your thinking in general. That is where the evidence is weakest.',
        'Half of these are well supported, so selecting everything that sounds like advice will not work.',
      ],
      explanation: `Not supported: ${c.unsupported.join('; ')}.\n\nSupported: ${c.supported.join('; ')}.\n\n${c.why}\n\nThe line that ties the refused claims together is worth carrying: effect size is inversely related to design quality. Brain training, chess-for-maths and music-for-cognition all look impressive against people who did nothing and collapse to near zero against people who did something else for the same hours. That single test — what was the comparison group actually doing — sorts most study claims you will meet.`,
      transferBridge:
        'Run the same check on any training claim: what did the comparison group do, and would the result survive comparing against a group who did something else equally demanding?',
    }
  },
)

/**
 * The entry point for the skill: a two-way sort with the supported and refused
 * techniques side by side. Deliberately concrete — every statement names an
 * activity rather than a principle.
 */
interface TierCase {
  setting: string
  works: string[]
  doesNot: string[]
  why: string
}

const TIER_CASES: TierCase[] = [
  {
    setting: 'Preparing for a test in two weeks.',
    works: [
      'Shutting the book and writing down what you remember',
      'Splitting the hours across the two weeks instead of one night',
      'Trying a problem before reading its worked solution',
    ],
    doesNot: [
      'Rereading the chapter a fourth time because it feels familiar',
      'Highlighting most of the pages in three different colours',
      'Copying the summary out neatly into a fresh notebook',
    ],
    why: 'The first three make you produce the material or force a gap; the last three make it feel smoother without producing anything.',
  },
  {
    setting: 'Learning forty words in another language.',
    works: [
      'Covering the meaning and saying the word before turning the card',
      'Returning to the same words on day one, day three and day seven',
      'Checking each answer so the wrong ones do not get rehearsed',
    ],
    doesNot: [
      'Reading the whole list aloud again because it flows now',
      'Watching someone else translate the same sentences',
      'Deciding whether you are a visual learner and using pictures only',
    ],
    why: 'Reading aloud and watching are both smooth and neither asks you to produce a word from memory; the learning-styles item has been tested directly and does not hold up.',
  },
  {
    setting: 'Getting better at a practical skill before an assessment.',
    works: [
      'Attempting it from memory before checking the instructions',
      'Practising on four separate days rather than one long one',
      'Having someone tell you what went wrong straight afterwards',
    ],
    doesNot: [
      'Watching demonstration videos rather than attempting it',
      'Practising with a broken tool because the difficulty helps',
      'Repeating the parts you already do well because they feel good',
    ],
    why: 'The broken-tool item is the one people get wrong: difficulty that lands on the equipment rather than on the material is effort that buys nothing.',
  },
  {
    setting: 'Revising a subject you find difficult.',
    works: [
      'Answering past questions before looking at the mark scheme',
      'Coming back to the topic a week later rather than the next day',
      'Explaining the idea out loud with everything closed',
    ],
    doesNot: [
      'Rereading the mark scheme instead of attempting the question',
      'Making the notes look neat instead of testing yourself on them',
      'Playing a brain-training game to sharpen up before you start',
    ],
    why: 'Every item in the second group produces something other than the material: a tidier page, a familiar scheme, or a better score in an unrelated game.',
  },
  {
    setting: 'Preparing for a mixed paper covering several topics.',
    works: [
      'Shuffling the topics that get confused into one practice set',
      'Answering from a blank page before opening anything',
      'Leaving a gap between sessions on the same topic',
    ],
    doesNot: [
      'Doing all of one topic, then all of the next, then all of the third',
      'Rereading each chapter summary the evening before the paper',
      'Doing puzzles beforehand to warm up your general thinking',
    ],
    why: 'Blocking by topic is not useless — it is the wrong choice for a mixed paper specifically, because it never rehearses choosing.',
  },
  {
    setting: 'Trying to remember something long term rather than for a test.',
    works: [
      'Testing yourself on it again after a month has passed',
      'Using the idea on a new problem rather than reviewing it',
      'Getting it wrong, being corrected, and trying again later',
    ],
    doesNot: [
      'Reviewing it every day so that it never has a chance to fade',
      'Reading your notes on it whenever you have a spare moment',
      'Learning a memory technique in the belief it improves learning generally',
    ],
    why: 'Daily review is the interesting one: it is not harmful, it is inefficient, because a gap is where the useful part of the work happens.',
  },
]

const learnTierSort = tpl(
  {
    id: 'md-le-tier-sort',
    name: 'Sort the study methods',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 2,
    variants: TIER_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, TIER_CASES)
    return {
      title: 'Supported, and not',
      prompt: `**The situation.** ${c.setting}\n\nSort each method. Two questions decide it: does it make you produce the material, and does it put a gap or a mix where one helps?`,
      answer: classify(
        rng,
        ['Supported by the evidence', 'Not supported'],
        [
          ...c.works.map((text) => ({ text, category: 0 })),
          ...c.doesNot.map((text) => ({ text, category: 1 })),
        ],
      ),
      hints: [
        'Ask what each method makes you PRODUCE. If the answer is "nothing", it belongs on the right.',
        'Then ask whether it puts a gap between sessions or mixes confusable things. Both of those help.',
        'Difficulty on its own is not a reason. Effort spent on a broken tool is still effort and it buys nothing.',
      ],
      explanation: `**Supported:** ${c.works.join('; ')}.\n\n**Not supported:** ${c.doesNot.join('; ')}.\n\n${c.why}\n\nThe supported side is short and specific: retrieval, spacing, attempting before being told, mixing confusable types, and feedback. That list is short on purpose. Everything on the other side either produces a feeling instead of a memory, or promises a general improvement that has been looked for repeatedly and not found.`,
    }
  },
)

/**
 * The limits. An area that teaches study science is the easiest place in the
 * app to overclaim, so one family exists purely to mark where the findings
 * stop — including the places where this app's own mechanics rest on less than
 * they appear to.
 */
interface LimitCase {
  question: string
  key: string
  decoys: string[]
  why: string
}

const LIMIT_CASES: LimitCase[] = [
  {
    question:
      'Spacing is one of the best-supported findings in the study literature. Where is it thinner than the slogan suggests?',
    key: 'For mathematical procedures the picture is weaker than for facts',
    decoys: [
      'It only works for people who already study well',
      'It has never been tested outside of laboratory conditions',
      'It stops working entirely once the gaps get longer than a week',
      'It applies to memory alone and has no effect on anything else at all',
    ],
    why: 'The verbal-material evidence is very strong; the evidence for spacing mathematical procedures specifically is more mixed. That is a real limit and it is much narrower than "it does not work".',
  },
  {
    question:
      'Mixed practice beats blocked practice on delayed mixed tests. What does the overall evidence look like once every study is counted?',
    key: 'A small average effect that varies a lot between studies',
    decoys: [
      'A large effect that shows up consistently in every study',
      'No effect at all once the weaker studies are removed',
      'A large effect in maths and none in any other subject area',
      'An effect that only appears in laboratory tasks rather than classrooms',
    ],
    why: 'The strongest classroom result is dramatic, and the pooled effect across studies is modest with a great deal of variation between them. Both facts are true, and reporting only the first is how a conditional finding becomes a slogan.',
  },
  {
    question:
      'Reading two cases that share a structure and writing out what they have in common improves transfer. How far does that finding actually reach?',
    key: 'To a similar new case, in students, within about a week',
    decoys: [
      'To any situation in life that shares an underlying structure',
      'To general reasoning ability, measured months afterwards',
      'To school subjects broadly, once enough comparisons are done',
      'Only to the two cases that were being compared in the first place',
    ],
    why: 'The study measured transfer to a structurally similar new case, in students, at delays up to about a week. That is a genuinely valuable result and it is not a claim about life in general — and the last decoy undersells it in the other direction.',
  },
  {
    question:
      'Attempting a problem before being taught the method beats the reverse order. What is NOT shown by that finding?',
    key: 'That struggling for longer produces more learning',
    decoys: [
      'That the attempt is worth making even when it fails',
      'That the order of activities matters, not just their content',
      'That being shown the method afterwards is still necessary',
      'That the effect has been measured across many separate studies',
    ],
    why: 'What was compared is an ORDER of two activities. Nothing in it says that more struggle is better, and the version that gets repeated — "struggle makes you learn" — is a claim the studies were not designed to test and do not support.',
  },
  {
    question:
      'This app schedules reviews at growing intervals. What is honest to say about that specific schedule?',
    key: 'Spreading reviews out is supported; this exact ladder is a judgement call',
    decoys: [
      'The interval lengths come directly from experimental findings',
      'Expanding gaps have been shown to beat equal gaps reliably',
      'The schedule is arbitrary, so it probably makes no difference',
      'Any schedule at all works equally well, so long as the reviews actually happen',
    ],
    why: 'That spaced beats massed is well supported. Which particular intervals to use is much less settled, and several studies find expanding and equal gaps roughly comparable. The honest position is the first one, and both extremes in the decoys are wrong.',
  },
  {
    question:
      'A large review ranked study techniques by usefulness. What does a low ranking for a technique actually mean?',
    key: 'It helps less per hour than the alternatives, not that it does nothing',
    decoys: [
      'The technique has been shown to damage learning outcomes',
      'The technique works only for a minority of learners',
      'The technique has never once been properly tested in real classrooms anywhere',
      'The technique produces no measurable benefit under any conditions',
    ],
    why: 'Rereading and highlighting are not harmful; they are a poor use of an hour compared with what else that hour could do. Turning "low utility" into "useless" is an overclaim in the direction that feels safe, and it is still an overclaim.',
  },
  {
    question:
      'Training people to spot a specific reasoning error can measurably improve their reasoning on that error. What does that not license?',
    key: 'Any claim that the training improves thinking in general',
    decoys: [
      'A claim that the improvement can be measured after training',
      'A claim that the improvement shows up on new examples of that error',
      'A claim that some biases respond better to training than others',
      'A claim that a short training session can produce a real effect',
    ],
    why: 'The measured improvements are on the specific move that was taught, on new examples of it. Every attempt to show a general improvement in thinking from this kind of training has come up short, and the largest reviews say so plainly.',
  },
  {
    question:
      'Feedback after a wrong answer helps. Where does the evidence get complicated?',
    key: 'Timing and detail change the effect, sometimes reversing it',
    decoys: [
      'Feedback has no effect unless it is given immediately',
      'Feedback only helps learners who were already doing well',
      'Feedback is only useful for facts, and not for problem solving at all',
      'Feedback that is delayed by more than a minute is wasted',
    ],
    why: 'Feedback is not one thing. Immediate and delayed feedback both have evidence behind them for different purposes, and very detailed feedback can remove the retrieval the learner would otherwise have done — which is why this app shows an explanation after an attempt rather than before one.',
  },
]

const learnLimits = tpl(
  {
    id: 'md-le-limits',
    name: 'Where the evidence stops',
    skillIds: ['x-learn'],
    bucket: 'meta',
    difficulty: 4,
    variants: LIMIT_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, LIMIT_CASES)
    return {
      title: 'The limits of the finding',
      prompt: c.question,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what was actually measured: on whom, on what task, after how long.',
        'Then check which options claim something wider than that, and which claim something narrower.',
        'The answer is usually the one that keeps the finding and refuses the extrapolation, in both directions.',
      ],
      explanation: `${c.key}. ${c.why}\n\nKnowing where a finding stops is not scepticism for its own sake. It is what lets you use the finding confidently inside its range instead of losing faith in it the first time someone points out that the slogan version is false. Both overclaiming and dismissing are ways of not using the evidence.`,
    }
  },
)

// =====================================================================
// x-desirable — difficulty that pays, and difficulty that does not
// =====================================================================

/**
 * "Difficulty is good because it hurts" is the standard distortion, so every
 * case here holds effort roughly constant and varies only where the effort
 * lands. Two of the eight have "remove the difficulty" as the key.
 */
interface PaysCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const PAYS_CASES: PaysCase[] = [
  {
    scene:
      'You are revising with a friend by taking turns to read paragraphs of the textbook aloud to each other.',
    key: 'Take turns saying what the last paragraph claimed, book shut',
    decoys: [
      'Read the paragraphs aloud faster to cover more of the chapter',
      'Take turns reading a paragraph each and then swapping books over',
      'Read the paragraphs standing up so that the session feels harder',
      'Read each paragraph twice, once each, so both of you hear it properly',
    ],
    why: 'All five take about the same time and only one makes anyone produce anything. Standing up is effort that lands on your legs, and reading twice doubles the exposure without adding a single act of recall.',
  },
  {
    scene:
      'Your practice sheet has the answers printed at the bottom of the same page, and your eye keeps finding them.',
    key: 'Fold the page over before starting each question',
    decoys: [
      'Leave it as it is, since checking each step prevents learning it wrong',
      'Cover the answers and never look at them, however long you are stuck',
      'Copy all the answers out first so the methods are fresh in mind',
      'Work faster so there is less time to glance down',
    ],
    why: 'A visible answer means the attempt never quite happens. Never looking at all is the opposite error and is worth naming: being stuck with no way forward teaches nothing either, which is why the move is to cover it and uncover it after a real try.',
  },
  {
    scene:
      'Your revision app has started logging you out every few minutes, so about a quarter of each session is spent signing back in.',
    key: 'Change the tool — this difficulty buys nothing',
    decoys: [
      'Keep it, since working around the interruptions adds useful effort',
      'Keep it and study for longer to make up the time that is being lost',
      'Keep it and back everything up on paper',
      'Keep it but work faster between the interruptions to compensate',
    ],
    why: 'This is the case that separates the two kinds of hard. Effort spent signing in is not effort spent remembering anything, and "harder" was never the goal — the goal was effort that lands on the material.',
  },
  {
    scene:
      'You have four hours for a test in ten days, and you were going to use them all on the evening of day nine.',
    key: 'Use them on four separate evenings across the ten days',
    decoys: [
      'Keep it as one block but move it to the evening of day ten',
      'Keep it as one block and start much earlier in the evening',
      'Split it into two evenings, both in the last two days before it',
      'Keep it as one block and add an hour to make it five in total',
    ],
    why: 'The same four hours, spread out, means some forgetting has happened before each session and has to be undone. The two-evening version captures a little of that and wastes most of the window, which is why it is the tempting half-measure.',
  },
  {
    scene:
      'You are practising a piece on a keyboard where two of the keys no longer make any sound.',
    key: 'Get it fixed — silent keys do not train anything',
    decoys: [
      'Keep going, since the extra concentration makes it useful practice',
      'Keep going and imagine the missing notes as you play through',
      'Keep going, avoiding those two keys',
      'Keep going but slow down so the missing notes matter less overall',
    ],
    why: 'The second decoy is the near miss, because imagining a note is a real exercise — and it is a different one from playing the piece, so it does not train the thing the performance needs. Difficulty caused by broken equipment is the clearest case of effort that buys nothing.',
  },
  {
    scene:
      'Your flashcards are being flipped after about two seconds each, and almost every card feels known.',
    key: 'Wait until you have actually produced the answer, however slow',
    decoys: [
      'Speed up further so that more cards can be covered per session',
      'Add another hundred cards so the deck covers the whole topic',
      'Read both sides of every card aloud to make the session harder',
      'Shuffle the deck more thoroughly between each of the sessions',
    ],
    why: 'Two seconds is long enough to recognise an answer and not long enough to retrieve one. Reading both sides aloud adds effort and removes the retrieval entirely, which is the pattern this whole family is about.',
  },
  {
    scene:
      'You always revise the same three topics because you can already do them, and they go smoothly every time.',
    key: 'Move to the topics where you get things wrong',
    decoys: [
      'Keep going, since a smooth session means the method is working well',
      'Keep going and speed up to cover more',
      'Keep going but add a fourth topic that is also comfortable',
      'Keep going and time yourself so the sessions feel more demanding',
    ],
    why: 'Smoothness is the signal that there is nothing left to gain here. Speeding up and timing yourself add difficulty without changing what is being practised, which is the distortion in its purest form: harder, and still pointed at material you already own.',
  },
  {
    scene:
      'You revise in a corridor where people keep stopping to talk to you, and you have a quiet room available.',
    key: 'Move to the quiet room',
    decoys: [
      'Stay, since learning to concentrate through noise is a useful skill',
      'Stay and use headphones',
      'Stay but revise something easier that survives being interrupted',
      'Stay and take a short break each time somebody stops to talk',
    ],
    why: 'The first decoy is a real idea in the wrong place: practising in the conditions of the test makes sense, and a corridor is not the conditions of the test. Interruptions cost their own length plus the time to get back, and none of that lands on the material.',
  },
]

const desirableWhichPays = tpl(
  {
    id: 'md-de-which-pays',
    name: 'Which difficulty pays?',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 3,
    variants: PAYS_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, PAYS_CASES)
    return {
      title: 'Where the effort lands',
      prompt: `**How it is being done now.** ${c.scene}\n\nWhich single change does the most for what is remembered a week later?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what each change would make you PRODUCE that you are not producing now.',
        'A change that only adds effort is not automatically an improvement. Effort has to land on the material.',
        'Some of these are fixed by REMOVING a difficulty rather than adding one. Check whether this is one of those.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThe useful difficulties are a specific short list — producing rather than reading, spacing rather than massing, attempting before being told, and mixing things that get confused. They happen to be hard. Being hard is a side effect and never the reason, which is why a noisy corridor, a broken key and a crashing app all add difficulty and buy nothing.`,
    }
  },
)

/**
 * The entry point, and the half of the idea that gets dropped: sometimes the
 * right move is to take a difficulty away. Every case here has an obstacle
 * that a learner might defend as "good for me".
 */
interface RemoveCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const REMOVE_CASES: RemoveCase[] = [
  {
    scene: 'Your notes from that lesson are so rushed that half of them cannot be read.',
    key: 'Get a readable copy and revise from that',
    decoys: [
      'Work through them anyway, since deciphering them is good practice',
      'Copy them out neatly first and then revise from the neat version',
      'Guess at the unreadable parts and check them later on if there is time',
      'Revise a different topic for now',
    ],
    why: 'Deciphering handwriting is effort that lands on handwriting. The neat-copy option is the closest miss and it spends the session producing a document instead of producing the material.',
  },
  {
    scene: 'You revise at one in the morning after a full day, and nothing goes in.',
    key: 'Move the session earlier tomorrow',
    decoys: [
      'Push through, since being tired makes the practice more demanding',
      'Push through but drink coffee so that the tiredness matters less',
      'Push through and do something easier that suits being tired',
      'Push through but make it shorter',
    ],
    why: 'Tiredness is difficulty that lands on you rather than on the material. Reducing the session is the near miss: it limits the damage without changing the fact that the hour is being spent in the worst available condition.',
  },
  {
    scene: 'You study at a desk where the chair is too low and your back hurts after ten minutes.',
    key: 'Fix the chair',
    decoys: [
      'Carry on, since being uncomfortable stops you getting too relaxed',
      'Carry on but take a break every ten minutes to stretch it out',
      'Carry on, standing up',
      'Carry on and do shorter sessions so the discomfort has less time',
    ],
    why: 'The first decoy is the distortion stated outright, and it is worth being able to hear as a claim: discomfort keeping you alert is not a finding, and even if it were, ten minutes of usable time is the wrong price.',
  },
  {
    scene: 'The practice website you use is full of adverts that cover the question while you read it.',
    key: 'Use the printed version instead',
    decoys: [
      'Keep using it, since working around distraction is a real skill',
      'Keep using it but close each advert before starting a question',
      'Keep using it and work faster',
      'Keep using it but only do questions that fit on the screen properly',
    ],
    why: 'Working around a distraction is a skill and it is not the skill you sat down to practise. Every second spent closing an advert is a second not spent on the question, and none of it makes the question stick.',
  },
  {
    scene: 'You are learning a method from a video where the presenter works far faster than you can follow.',
    key: 'Find a version you can keep up with',
    decoys: [
      'Keep watching, since struggling to follow makes you concentrate harder',
      'Keep watching and pause it constantly to catch up as you go',
      'Keep watching it until it is clear',
      'Keep watching but take notes so you can work it out afterwards',
    ],
    why: 'Watching a method you cannot follow is not a desirable difficulty; the effort goes into keeping up rather than into the method. Pausing constantly is the reasonable-sounding option and it turns a ten-minute video into an hour without adding an attempt.',
  },
  {
    scene: 'Your flashcard app has lost most of your saved decks and you spend each session rebuilding them.',
    key: 'Rebuild them once, properly, outside a study session',
    decoys: [
      'Carry on, since typing the cards out again is a form of revision',
      'Carry on and rebuild a few each session until they are all back',
      'Carry on but use paper cards for the ones that keep disappearing',
      'Carry on and study only the decks that have survived so far',
    ],
    why: 'The first decoy contains a half-truth — typing a card is a weak form of exposure — and it is being used to justify spending study time on admin. Separating the two is what the answer does.',
  },
  {
    scene:
      'Your practice problems come from a book with several misprinted answers, and you cannot tell which are wrong.',
    key: 'Switch to a source you can check against',
    decoys: [
      'Keep going, since deciding whether an answer is wrong is good practice',
      'Keep going and check every disputed answer with someone else',
      'Keep going and ignore the answers',
      'Keep going but only trust the answers that match your own working',
    ],
    why: 'Feedback you cannot trust is worse than slow feedback, because a wrong answer confirmed by a misprint gets rehearsed. The last decoy is the dangerous one: trusting only the answers that agree with you removes the entire point of checking.',
  },
  {
    scene:
      'You revise with a friend who talks constantly, and you leave each session having covered almost nothing.',
    key: 'Study alone and meet afterwards to test each other',
    decoys: [
      'Carry on — explaining helps',
      'Carry on but agree to talk only during the breaks in future',
      'Carry on and choose easier material that survives the interruptions',
      'Carry on and make the sessions longer to fit the same amount in',
    ],
    why: 'Testing each other is genuinely useful, which is why it is kept in the answer rather than thrown away. What is being removed is the part that produces nothing — and "talk only in the breaks" is the version that sounds like a compromise and has already failed once.',
  },
]

const desirableRemoveIt = tpl(
  {
    id: 'md-de-remove-it',
    name: 'The difficulty to take away',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 2,
    variants: REMOVE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, REMOVE_CASES)
    return {
      title: 'Not all hard is useful',
      prompt: `${c.scene}\n\nWhat should be done?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask where the effort is going. Into the material, or into the room, the tool, or your own tiredness?',
        'If the effort lands anywhere except the material, it is a cost with nothing on the other side.',
        'Watch for options that defend the obstacle as character-building. That is the claim being tested here.',
      ],
      explanation: `${c.key}. ${c.why}\n\nHalf of the idea is that some difficulty helps. The other half — the half that gets dropped — is that most difficulty does not, and defending an obstacle because it is hard is how the useful version of the idea turns into a reason to put up with anything.`,
    }
  },
)

/**
 * Multi-select, because a plan usually contains several changes at once and
 * the skill is telling which of them are doing anything. Correct sets vary by
 * case, so the answer cannot be a remembered list.
 */
interface AddCase {
  scene: string
  pays: string[]
  costs: string[]
  why: string
}

const ADD_CASES: AddCase[] = [
  {
    scene: 'A study plan for a science test in two weeks.',
    pays: [
      'Answer the end-of-chapter questions before rereading the chapter',
      'Return to each topic after a gap rather than finishing it in one go',
      'Shuffle the two topics that keep getting confused into one set',
    ],
    costs: [
      'Work with the television on to build up your concentration',
      'Write every answer in your least comfortable handwriting',
      'Set a timer that beeps every three minutes to keep you alert',
    ],
    why: 'The first three change what you produce or when you produce it. The last three add effort that never touches the science.',
  },
  {
    scene: 'A revision plan for a language exam in a month.',
    pays: [
      'Cover the translation and produce it before checking',
      'Practise on four separate days rather than one long day',
      'Mix the two tenses that get confused into the same exercise',
    ],
    costs: [
      'Study on a crowded bus where one hand has to hold on',
      'Use a printout with half of the accents missing from it',
      'Work through the vocabulary list backwards to make it harder',
    ],
    why: 'Reversing the list order is the interesting one: it feels like a desirable difficulty and it only defeats the order you memorised, which was not the thing being tested.',
  },
  {
    scene: 'A practice plan for a musical performance in five weeks.',
    pays: [
      'Play the piece from memory before opening the score again',
      'Practise the three hard bars on four separate days',
      'Move between the three hard bars rather than one per night',
    ],
    costs: [
      'Practise on an instrument that is slightly out of tune',
      'Practise so quietly that you cannot hear your own mistakes',
      'Practise standing on one leg to make the session harder',
    ],
    why: 'Not being able to hear your mistakes is difficulty that removes the feedback, which is the one thing you cannot practise without.',
  },
  {
    scene: 'A plan for an essay-based exam in six weeks.',
    pays: [
      'Write a plan from memory before opening any notes',
      'Sit one timed question a week rather than six in the last week',
      'Alternate between the question types the paper mixes',
    ],
    costs: [
      'Write every practice essay in a room where people keep talking',
      'Write with a pen that skips so every line has to be gone over twice',
      'Write practice essays without ever reading the mark scheme',
    ],
    why: 'Never reading the mark scheme is the one that looks like independence: it removes feedback rather than adding difficulty, and it is the same fault as practising where you cannot hear yourself.',
  },
  {
    scene: 'A plan for a maths test covering four topics in three weeks.',
    pays: [
      'Attempt each problem for two minutes before opening the solution',
      'Spread the four topics across the three weeks rather than one each',
      'Mix the topics within each session instead of one per session',
    ],
    costs: [
      'Do every calculation in your head to make it more demanding',
      'Work only in the last hour of the evening when you are tired',
      'Use a website that logs you out every few minutes',
    ],
    why: 'Doing everything mentally is the near miss: it is a real skill and it is a different one, and on a paper where working is allowed it adds errors rather than learning.',
  },
  {
    scene: 'A plan for a practical assessment in four weeks.',
    pays: [
      'Attempt the procedure from memory before checking the steps',
      'Practise on four separate days rather than one long afternoon',
      'Have the three procedures called out in a random order',
    ],
    costs: [
      'Practise with equipment that is missing one of its parts',
      'Practise in a room too cold to hold anything steady',
      'Practise with the instructions covered and never uncover them',
    ],
    why: 'The third cost is the closest to a genuine desirable difficulty and crosses the line: covering the instructions is right, and never uncovering them removes the check that tells you whether the attempt was any good.',
  },
]

const desirableAddMulti = tpl(
  {
    id: 'md-de-multi',
    name: 'Which changes actually pay?',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 3,
    variants: ADD_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ADD_CASES)
    return {
      title: 'Six changes, three that help',
      prompt: `**${c.scene}** Six changes are being considered. Select every one that would actually improve what is remembered later.`,
      answer: multi(rng, [...c.pays], [...c.costs]),
      hints: [
        'For each one, ask what it makes you produce, or what gap or mix it introduces.',
        'Then ask where the extra effort goes. If it goes into the room, the tool or your body, it is a cost.',
        'One of the unhelpful ones usually removes feedback rather than adding difficulty. That is the hardest to spot.',
      ],
      explanation: `**Pays:** ${c.pays.join('; ')}.\n\n**Costs without paying:** ${c.costs.join('; ')}. ${c.why}\n\nThe test that separates them is not how hard the change makes the session feel. It is whether the extra effort is spent pulling the material out of your own head, waiting through a gap, or telling two confusable things apart. Everything else is just harder.`,
    }
  },
)

/**
 * The routine as an ordering task. What the order encodes is the one thing the
 * fluency illusion makes people get wrong: the attempt comes before the model,
 * and the delayed re-test is not optional, because a repair checked only by
 * agreement has not been checked.
 */
interface RoutineCase {
  setting: string
  steps: string[]
  why: string
}

const ROUTINE_CASES: RoutineCase[] = [
  {
    setting: 'Working through a set of problems with worked solutions available.',
    steps: [
      'Cover the solution and attempt the problem for a couple of minutes',
      'Uncover it and find the exact line where yours and theirs diverge',
      'Write down what you would do differently, in your own words',
      'Try a different problem of the same kind a few days later',
    ],
    why: 'The attempt has to come first or there is nothing for the solution to be an answer to.',
  },
  {
    setting: 'Learning a definition you have to be able to reproduce.',
    steps: [
      'Write down what you think it says without looking at anything',
      'Compare with the real one and mark exactly what was missing',
      'Write it once more from memory, including the missing part',
      'Write it again from memory a week later, with nothing open',
    ],
    why: 'The second writing proves the correction was understood; only the delayed one proves it was learned.',
  },
  {
    setting: 'Fixing a mistake the marker has pointed out on your work.',
    steps: [
      'Say what you were thinking when you made it, before reading the comment',
      'Read the comment and name which of the four causes it was',
      'Redo that one question with the comment covered up',
      'Meet the same kind of question again after a gap of some days',
    ],
    why: 'Naming the cause is what decides the repair; without it every correction turns into "do more practice".',
  },
  {
    setting: 'Learning a procedure from a demonstration.',
    steps: [
      'Predict what the first step will be before the demonstration starts',
      'Watch it once, then write the steps down without looking',
      'Do it yourself with your written version covered',
      'Do it again from nothing several days later',
    ],
    why: 'Predicting first is what makes the demonstration answer a question rather than pass by as something that made sense.',
  },
  {
    setting: 'Revising a topic you covered a month ago.',
    steps: [
      'Write everything you can still remember on a blank page',
      'Open the notes and mark what was missing rather than rereading',
      'Answer two questions on the parts that were missing',
      'Come back to those same parts again in a week',
    ],
    why: 'Starting with the blank page is what turns the notes into a diagnosis instead of a reread.',
  },
  {
    setting: 'Learning to use a new tool or piece of software.',
    steps: [
      'Try to do the task without opening any instructions at all',
      'Look up only the step you got stuck on, and nothing else',
      'Finish the task from your own memory of what you looked up',
      'Do a similar task from scratch a few days afterwards',
    ],
    why: 'Looking up only the stuck step is what keeps the rest of the task yours, which is where the learning is.',
  },
]

const desirableRoutineOrder = tpl(
  {
    id: 'md-de-routine-order',
    name: 'Order the study routine',
    skillIds: ['x-desirable'],
    bucket: 'meta',
    difficulty: 3,
    variants: ROUTINE_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ROUTINE_CASES)
    return {
      title: 'Attempt, compare, repair, re-test',
      prompt: `**The situation.** ${c.setting}\n\nPut these four steps into the order that produces the most learning.`,
      answer: ordered(rng, c.steps),
      hints: [
        'Something has to be produced from your own head before anything is shown to you.',
        'Comparing is not rereading: the useful version finds the exact place where your version and the real one part company.',
        'The last step happens after a gap, and leaving it out is what makes corrections stop sticking.',
      ],
      explanation: `The order is:\n1. ${c.steps[0]}\n2. ${c.steps[1]}\n3. ${c.steps[2]}\n4. ${c.steps[3]}\n\n${c.why} Each step is doing one job. The attempt makes the gap visible, so what comes next lands as an answer. The comparison locates the divergence rather than re-reading the whole thing. The repair produces the corrected version rather than agreeing with it. And the delayed re-test is the only one of the four that can tell you whether any of it worked, because everything before it happened with the material in front of you.\n\nWhat is supported here: attempting before being told beats the reverse order, and delayed retrieval beats immediate review. What is a judgement call: this specific four-step shape. It is an arrangement of those two findings rather than a finding of its own.`,
    }
  },
)

// =====================================================================
// x-transfer — noticing when something applies
// =====================================================================

/**
 * The noun-free description. Stripping the surface is the concrete move that
 * makes structural remindings possible, and it can be practised directly:
 * four descriptions, one of which is actually of this problem.
 */
interface StripCase {
  problem: string
  key: string
  decoys: string[]
  why: string
}

const STRIP_CASES: StripCase[] = [
  {
    problem:
      'A tank holds 900 litres. One pipe fills it in 30 minutes and another in 45. Both are opened. How long until it is full?',
    key: 'Two steady rates act together; find how long the job takes',
    decoys: [
      'A total is shared between two parties in a fixed ratio',
      'One quantity is measured and the same proportion is carried to a second, larger group',
      'A quantity changes by a fixed percentage repeatedly over time',
      'Two quantities are known and the relationship between them is wanted',
    ],
    why: 'The 900 never enters the working, which is the giveaway: the structure is two rates on one job, and the last decoy is close enough to be worth refusing — a relationship between two quantities is not the same as two rates acting together.',
  },
  {
    problem:
      'A coat is £84 after a quarter has been taken off. What was the original price?',
    key: 'An amount after a change is known; the amount before it is wanted',
    decoys: [
      'Two amounts are known and the change between them is wanted',
      'An amount and a rate are known and the total is wanted',
      'A proportion is measured in one group and applied to another group of a different size',
      'A quantity is split into parts whose sizes are related to each other',
    ],
    why: 'Which number you are GIVEN is the whole discrimination here. The first decoy describes a percentage-change problem, which uses the same words and runs the arithmetic in the opposite direction.',
  },
  {
    problem:
      'Two phone plans cost £12 plus 5p a minute, and £4 plus 9p a minute. When do they cost the same?',
    key: 'Two totals, each a start plus a rate, are set equal',
    decoys: [
      'One total is a start plus a rate and its value at a given time is wanted',
      'Two rates act on the same job and the time taken is wanted',
      'A total is divided into a whole number of equal parts',
      'Two quantities grow together and one is scaled to match the other',
    ],
    why: 'The first decoy is the same structure with the question changed, and that change is what decides whether you evaluate or solve. Naming what is WANTED is as much a part of the description as naming what is given.',
  },
  {
    problem:
      'A drawer holds 6 black socks and 4 white ones. Two are taken out in the dark. What is the chance both are black?',
    key: 'Two draws with no replacement; both have to succeed',
    decoys: [
      'Several tries, at least one must succeed',
      'Several independent choices made in turn, and the total number of combinations is wanted',
      'A proportion of a group is known and the size of the group is wanted',
      'Two events happen and only one of them needs to succeed',
    ],
    why: '"Both" and "at least one" point at different calculations, and "with replacement" and "without" change the second fraction. The first decoy gets both of those wrong while sounding almost identical.',
  },
  {
    problem:
      'A colony of 500 bacteria multiplies by 1.3 each hour. How many after 7 hours?',
    key: 'A start is multiplied by the same factor repeatedly',
    decoys: [
      'A start has a fixed amount added each time',
      'A total is known after a change and the amount before it is wanted',
      'Two quantities grow together, so one can be scaled from the other',
      'A rate is measured over one period and the total over several is wanted',
    ],
    why: 'Multiplied each time and increased by a fixed amount each time look almost identical in words and diverge enormously in results. That first decoy is the single commonest misreading of a growth problem.',
  },
  {
    problem:
      'A sample of 80 components contains 6 faulty ones. A batch holds 1,200. How many faulty ones would you expect?',
    key: 'A proportion from one group is carried to a larger group',
    decoys: [
      'A total and a number of parts are known and the size of each part is wanted',
      'An amount after a percentage change is known and the amount before it is wanted',
      'Two groups are compared for their difference',
      'A quantity is measured twice and the change between the measurements is wanted',
    ],
    why: 'Carrying a rate across is not the same as comparing two groups, and the difference shows up the moment the second group is a different size — which is exactly the situation here.',
  },
  {
    problem:
      'A field is enclosed by 60 m of fence with a river along one side, so only three sides are fenced. What dimensions give the biggest area?',
    key: 'A fixed total is split to make another quantity as large as possible',
    decoys: [
      'A fixed total is split into parts whose sizes are in a given ratio',
      'Two quantities are known and a third is found from the relationship between them',
      'A shape’s dimensions are known and its area is wanted',
      'A total is known and the number of equal parts it makes is wanted',
    ],
    why: 'The word that decides it is "biggest": this is a maximisation, and every decoy describes a problem where the answer is determined rather than chosen. The river matters too, because it changes what the 60 is spread across.',
  },
  {
    problem:
      'A survey of gym members finds that 78% sleep well, and a report concludes that exercise improves sleep in the general population.',
    key: 'A group selected on something related to the outcome is read as everyone',
    decoys: [
      'Two things move together and one is assumed to cause the other',
      'A small sample is used to make a claim about a very large group',
      'A percentage is quoted without saying what it is a percentage of',
      'An average is reported where the spread would have been more informative',
    ],
    why: 'All four decoys are real faults and the first one is genuinely present as well — but the structural feature that makes the sample useless is who could appear in it, which is a different objection from the causal one and survives even if causation were established.',
  },
]

const transferNounFree = tpl(
  {
    id: 'md-tx-noun-free',
    name: 'Describe it with no nouns',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 3,
    variants: STRIP_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, STRIP_CASES)
    return {
      title: 'The problem with its surface removed',
      prompt: `**Problem.** ${c.problem}\n\nWhich description is of THIS problem, once the subject is stripped out?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Write your own version first: what is given, what changes, and what is wanted.',
        'Include what is WANTED. Two problems can be given identical information and still need different methods.',
        'Check each description against the problem clause by clause. Most of them fail on exactly one clause.',
      ],
      explanation: `${c.key}. ${c.why}\n\nWriting the noun-free line takes about ten seconds and it is the only version of a problem that can match anything else. Remindings mostly arrive by surface — people are reminded of the last problem about socks, not the last problem with two draws and no replacement — so the description is what makes a useful reminding possible at all.`,
    }
  },
)

/**
 * Multi-select structural matching. A single-answer version lets a learner
 * find the one that "feels like" a match; requiring every match forces the
 * description to be applied to all of them.
 */
interface MatchCase {
  problem: string
  matches: string[]
  nonMatches: string[]
  structure: string
}

const MATCH_CASES: MatchCase[] = [
  {
    problem: 'A boat travels 24 km upstream and back, against and with a current.',
    matches: [
      'A runner does a lap uphill and back downhill at different speeds',
      'A cyclist rides out into a headwind and returns with a tailwind',
    ],
    nonMatches: [
      'A boat travels 24 km at a steady speed and the time is wanted',
      'Two boats set off towards each other and meet somewhere between',
      'A boat’s fuel use rises by 8% and the new figure is wanted',
    ],
    structure: 'two legs of equal distance covered at different speeds, so the slower leg takes more of the time',
  },
  {
    problem: 'A shop reports that 91% of the customers who filled in its feedback card were satisfied.',
    matches: [
      'A club surveys the members who came to the end-of-year dinner',
      'A course reports the exam results of the students who sat the exam',
    ],
    nonMatches: [
      'A shop compares this month’s sales with the same month last year',
      'A shop reports an average basket value without the spread',
      'A shop’s satisfaction score rose 3% after a small refurbishment',
    ],
    structure: 'a group filtered by something connected to the outcome, then read as if it were everyone',
  },
  {
    problem: 'A council widens the busiest road so that the morning queue gets shorter.',
    matches: [
      'A library raises its overdue fine so that books come back sooner',
      'A shop opens a tenth till so that the evening queue gets shorter',
    ],
    nonMatches: [
      'A council resurfaces a road so that journeys become smoother',
      'A council counts traffic on one sunny Tuesday and plans a year',
      'A council compares two roads whose traffic differs a great deal',
    ],
    structure: 'a change whose effect on behaviour works against what the change was for',
  },
  {
    problem: 'A coach gives extra sessions to the five players who performed worst last month.',
    matches: [
      'A factory services the machines with the worst output that week',
      'A shop advertises after its worst sales month in several years',
    ],
    nonMatches: [
      'A coach gives extra sessions to five players chosen at random',
      'A coach compares two squads whose average performance is equal',
      'A coach measures the same five players twice on the same day',
    ],
    structure: 'a group picked for being at an extreme, whose next measurement moves back on its own',
  },
  {
    problem: 'A team has spent two years on a product nobody wants and continues because of the two years.',
    matches: [
      'A student keeps a doomed essay plan because of the hours already in it',
      'A council finishes a car park nobody uses because of the money spent',
    ],
    nonMatches: [
      'A team abandons a product because a rival released one first',
      'A team spends two years on a product and it succeeds',
      'A team compares the cost of finishing against the cost of starting again',
    ],
    structure: 'money or time already gone, treated as a reason to continue',
  },
  {
    problem: 'A student rereads her notes four times, feels they are familiar, and stops revising.',
    matches: [
      'A driver watches a route video repeatedly and feels ready to drive it',
      'A cook reads a recipe until it feels obvious and never cooks it',
    ],
    nonMatches: [
      'A student rereads her notes and finds a section she had not seen',
      'A student reads notes she wrote badly and cannot follow them',
      'A student rereads notes and then answers questions from memory',
    ],
    structure: 'ease of processing being read as evidence of being able to produce it',
  },
]

const transferMatchMulti = tpl(
  {
    id: 'md-tx-load-bearing',
    name: 'Which of these work the same way?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 3,
    variants: MATCH_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, MATCH_CASES)
    return {
      title: 'More than one of them matches',
      prompt: `**The situation.** ${c.problem}\n\nSelect every situation below that works the same way underneath. There is more than one, and some of the closest-looking ones do not.`,
      answer: multi(rng, [...c.matches], [...c.nonMatches]),
      hints: [
        'Describe the situation with the nouns removed: what happens, and what follows from it.',
        'Then check each option against that description rather than against the subject.',
        'Three of these share the setting and do something structurally different. Sharing a setting is not a reason.',
      ],
      explanation: `The matches are: ${c.matches.join('; ')}.\n\nWhat they share: ${c.structure}.\n\nThe others: ${c.nonMatches.join('; ')} — every one of them stays in the same world as the original and does something different underneath, which is exactly why they are the tempting ones. Over 80% of the situations that come to mind unprompted are brought there by shared surface details, so the options that share a setting are not badly written traps; they are what memory offers first.`,
    }
  },
)

/**
 * Why did that come to mind, and is it any use? Naming the source of a
 * reminding is the metacognitive half of transfer, and it is cheap to do.
 */
interface RemindCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const REMIND_CASES: RemindCase[] = [
  {
    scene:
      'A problem about mixing paint reminds you of a problem about mixing paint from last term. That one was about the cost per litre; this one asks about the ratio of colours.',
    key: 'Same subject, different method — not useful here',
    decoys: [
      'Useful: the earlier problem gives you a head start on this one',
      'Useful: any reminding is worth following up when you are stuck',
      'Not useful — last term is too long ago',
      'Impossible to tell without solving both of the problems first',
    ],
    why: 'Paint is the only thing they share. Following the reminding would import a method that answers a different question, which is worse than having no reminding at all.',
  },
  {
    scene:
      'A problem about two workers finishing a job together reminds you of a problem about two pipes filling a tank.',
    key: 'Different subject, same method — worth following',
    decoys: [
      'Not useful — people and water differ',
      'Useful, but only because both problems involve two of something',
      'Not useful, because remindings from other topics are usually wrong',
      'Impossible to judge without checking the numbers in both of them',
    ],
    why: 'Two steady rates acting on one job, in both. The surface could hardly be further apart, which is why this reminding is the valuable kind and also the rare kind.',
  },
  {
    scene:
      'A question about a survey of gym members reminds you of a question about a survey of gym members. The first was about a misleading average; this one is about who filled the survey in.',
    key: 'Same setting, different fault — check before using it',
    decoys: [
      'Useful: it is the same setting, so the same objection applies',
      'Useful: survey questions almost always have the same problem',
      'Not useful, since two questions are never really about the same thing',
      'Useful — you now distrust surveys',
    ],
    why: 'Two genuinely different faults can live in the same setting, and the last decoy is the one to watch: a general distrust of surveys is not a reading of this survey and would fire whether or not anything was wrong.',
  },
  {
    scene:
      'A problem about the chance of at least one train being late reminds you of one about the chance of at least one seed failing.',
    key: 'Different subject, same shape — follow it',
    decoys: [
      'Not useful — trains are not seeds',
      'Useful, but only if the two probabilities are the same number',
      'Not useful, since probability problems all look alike anyway',
      'Impossible to say without knowing how many trains and seeds there are',
    ],
    why: 'Both ask for at least one success or failure across several independent tries, which is one clean calculation once you flip it to "none". The numbers do not have to match for the method to transfer, which is what the second decoy misses.',
  },
  {
    scene:
      'A question about a school’s exam results reminds you of your own school’s exam results.',
    key: 'A memory, not a method — set it aside',
    decoys: [
      'Useful: personal experience of the setting helps you understand it',
      'Useful — you know how this works',
      'Not useful, because your school is not the school in the question',
      'Useful, as long as you do not let it bias your answer either way',
    ],
    why: 'The reminding brings a memory of a place rather than a method for a problem. The third decoy reaches the right verdict for the wrong reason — the fault is not that the schools differ, it is that nothing about the reminding is a way of working anything out.',
  },
  {
    scene:
      'A question about a shop raising prices then lowering them reminds you of a question about a population falling then rising.',
    key: 'Different subject, same trap — follow it',
    decoys: [
      'Not useful: prices and populations behave in completely different ways',
      'Useful, but only because both of them involve percentages somewhere',
      'Not useful — the order differs',
      'Useful only if the two percentages happen to be the same size',
    ],
    why: 'Both apply two successive percentage changes to a base that has already moved, so neither pair cancels. The order does not matter and neither does the subject, which is what the third and fourth decoys get wrong.',
  },
  {
    scene:
      'A problem about a ladder against a wall reminds you of every other ladder problem you have done, all of which used the same right-angle relationship. This one gives an angle rather than a second length.',
    key: 'Same subject, and the given information has changed',
    decoys: [
      'Useful: ladder problems are always solved the same way',
      'Useful: the relationship applies to every right-angled triangle',
      'Not useful, since this problem is clearly a much harder one',
      'Impossible to tell until you have drawn the triangle out properly',
    ],
    why: 'The second decoy is true and does not help: the relationship does hold, and it cannot be fed by an angle and one side. A method is only available if the problem supplies its ingredients, which is the check the reminding skipped.',
  },
  {
    scene:
      'A question about a training programme for the slowest runners reminds you of a question about a supplement for the sickest patients.',
    key: 'Different subject, same selection — follow it',
    decoys: [
      'Not useful — sport is not medicine',
      'Useful, but only because both involve measuring people twice',
      'Not useful, since one is about improving and one about recovering',
      'Useful only if both studies used the same number of participants',
    ],
    why: 'Both picked a group for being at an extreme and then measured it again, which guarantees movement back towards the middle whether or not anything worked. Everything that differs between them is surface.',
  },
]

const transferWhyReminded = tpl(
  {
    id: 'md-tx-why-reminded',
    name: 'Why did that come to mind?',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 2,
    variants: REMIND_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, REMIND_CASES)
    return {
      title: 'Useful reminding, or just a familiar word',
      prompt: `${c.scene}\n\nIs the reminding worth following?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Ask what the two situations share: the subject, or the way they work?',
        'A shared subject is the commonest reason something comes to mind and the weakest reason to follow it.',
        'A shared method is worth following even when the two situations have nothing else in common at all.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThe useful habit is one extra second: when something comes to mind, name what brought it. If the answer is the subject, check before using it. If the answer is the structure, follow it — that reminding is rare and it is the one that pays.`,
    }
  },
)

/**
 * The transfer test proper: a move taught in one setting, offered in a
 * completely different one, with no naming of what the move is. Distractors
 * are surface-matched to the new setting.
 */
interface NewDomainCase {
  scene: string
  key: string
  decoys: string[]
  why: string
}

const NEW_DOMAIN_CASES: NewDomainCase[] = [
  {
    scene:
      'A youth club says its members are happier than average, and points out that its happiest members are the ones who have been coming longest.',
    key: 'Find the members who joined and stopped coming',
    decoys: [
      'Survey more long-standing members',
      'Ask the members whether they think the club has made them happier',
      'Compare this club with a club that runs a completely different programme',
      'Check whether the longest-standing members were happier to begin with',
    ],
    why: 'The people who left are missing from every count, and they are the ones who would answer the question. The last decoy is the near miss and it is a good instinct — it asks about a confound rather than about who is absent, and only the second one can be settled.',
  },
  {
    scene:
      'A cafe adds a loyalty stamp card and finds its stamped customers spend more than its unstamped ones.',
    key: 'Check who chose to take a card in the first place',
    decoys: [
      'Compare the spending of stamped customers before and after',
      'Ask the stamped customers whether the card changed their habits',
      'Give cards to everyone and see whether total spending rises',
      'Check whether the card began in a busy period',
    ],
    why: 'Regular customers are the ones who take a loyalty card, so the two groups differed before the card existed. The third decoy is genuinely a good design and it is a much bigger intervention than the check the situation calls for first.',
  },
  {
    scene:
      'A school introduces a new reading scheme for the twenty children with the lowest reading scores, and their scores rise by the next test.',
    key: 'Compare with twenty equally low scorers given nothing',
    decoys: [
      'Ask the teachers whether the scheme seemed to be working',
      'Check whether the second reading test was an easier one',
      'Run the scheme with the twenty highest scorers as well',
      'Repeat the test several more times until the scores settle down',
    ],
    why: 'A group chosen for being at an extreme moves back towards the middle on its own, so the rise was guaranteed before the scheme started. Only a matched group that got nothing can separate the two stories.',
  },
  {
    scene:
      'A charity reports that donations rose 300% after it changed its website, and calls the change a success.',
    key: 'Ask what the donations were before the change',
    decoys: [
      'Ask whether the website change was the only thing that changed',
      'Ask whether the rise has held up over more than one month',
      'Ask whether the donors were new',
      'Ask whether other charities saw a similar rise in the same period',
    ],
    why: 'Every decoy is a good question, and every one of them assumes the 300% means something. If donations went from two to eight, the whole discussion is about six donations — the base has to come first because it decides whether the rest is worth asking.',
  },
  {
    scene:
      'A gym is deciding whether to keep a class that has cost it £4,000 to run so far and currently loses money every week.',
    key: 'Decide on what the next month costs and brings in',
    decoys: [
      'Keep it until the £4,000 has been recovered from the class',
      'Keep it, since stopping now would waste the £4,000 entirely',
      'Work out how many more weeks are needed to break even overall',
      'Compare the £4,000 with what other classes cost to set up',
    ],
    why: 'The £4,000 is gone under either choice, so it cannot favour either one. Two of the decoys build a plan around recovering it, which is how a loss becomes a reason to keep making the same loss.',
  },
  {
    scene:
      'A hospital finds that the ward with the highest recovery rate also has the lightest workload, and plans to reduce workload across all wards.',
    key: 'Check whether that ward also takes the least ill patients',
    decoys: [
      'Reduce workload on one ward first and measure what happens',
      'Ask the staff on that ward what they think makes the difference',
      'Check whether the recovery rate has been high for several years',
      'Compare the workload figures against another hospital’s wards',
    ],
    why: 'A third factor — how ill the patients are — would produce both the light workload and the high recovery rate on its own. The first decoy is a good next step and it comes after this check, not instead of it.',
  },
  {
    scene:
      'A shop notices that its best sales days are the days its most experienced assistant works, and plans to give that assistant more shifts.',
    key: 'Check which days that assistant is scheduled to work',
    decoys: [
      'Compare that assistant’s sales with the other assistants’ sales',
      'Ask the assistant what they do differently',
      'Give the assistant more shifts and see whether sales rise further',
      'Check whether the assistant works longer hours than the others',
    ],
    why: 'If the most experienced assistant is scheduled on Saturdays, the busiest day is doing the work rather than the assistant. Every decoy investigates the assistant, which is the thing the observation already points at.',
  },
  {
    scene:
      'A student says her marks improved after she started studying with music on, so she recommends it to everyone.',
    key: 'Ask what else changed at the same time',
    decoys: [
      'Ask what kind of music it was',
      'Ask how many pieces of work the improvement is based on',
      'Ask whether she enjoyed studying more with the music playing',
      'Ask whether her marks stayed high in the following term as well',
    ],
    why: 'Someone who changes how they study has usually changed several things at once — including how much they study. The sample-size question is the closest miss and it would matter second; what comes first is that the one change being credited was not the only change.',
  },
]

const transferNewDomain = tpl(
  {
    id: 'md-tx-new-domain',
    name: 'The same move, somewhere else entirely',
    skillIds: ['x-transfer'],
    bucket: 'meta',
    difficulty: 4,
    variants: NEW_DOMAIN_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, NEW_DOMAIN_CASES)
    return {
      title: 'What should be checked first?',
      prompt: `${c.scene}\n\nWhat is the first thing to check?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Describe what happened with the subject removed: what was measured, on whom, and what was concluded.',
        'Ask what would have to be true for the conclusion to follow, and whether anything here establishes it.',
        'Several options are sensible questions. Ask which one, if the answer came back badly, would make the rest pointless.',
      ],
      explanation: `${c.key}. ${c.why}\n\nEvery option here is a reasonable-sounding next step, which is deliberate: the skill being tested is not spotting an absurd answer but ordering good ones. The check that comes first is the one whose answer could make all the others irrelevant.`,
    }
  },
)

// =====================================================================
// x-compare — four more two-case sets
// =====================================================================

/**
 * Deliberately the same three checkpoints as `caseComparison.ts` and
 * `transferLab.ts`, so the structure cannot drift between files: compare in
 * writing (ungraded — the app cannot read prose and pretending to would be
 * worse than saying so), name the structure (graded), then apply it to a third
 * cover story (graded, and the actual transfer test).
 *
 * The four structures here are new to the app. Already used elsewhere:
 * trade-offs, selection effects, the outside view, percentage bases,
 * regression to the mean, sunk cost, base rates, second-order effects, the
 * contrapositive check and the fluency illusion.
 */
interface CompareSet {
  principle: string
  a: { title: string; text: string }
  b: { title: string; text: string }
  criteria: string[]
  model: string
  key: string
  decoys: string[]
  transfer: { text: string; key: string; decoys: string[] }
  why: string
}

function compareItem(rng: Rng, set: CompareSet) {
  return {
    title: 'Two cases',
    prompt: 'Two situations that look nothing alike. Read both, then work out what they have in common.',
    explanation: `${set.principle}. ${set.why}`,
    hints: [
      'Cross out every name, place and subject. Describe what is left.',
      'Say what was measured, what was compared, and what was concluded — in that order.',
      'The structure is whatever makes the same objection land in BOTH cases.',
    ],
    parts: [
      part('Compare', {
        study: `CASE 1 — ${set.a.title}\n\n${set.a.text}\n\nCASE 2 — ${set.b.title}\n\n${set.b.text}`,
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
          'Write down what each case measured and what it concluded from that.',
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

// ------------------------------------------------------------- confounding

const CONFOUND_SETS: CompareSet[] = [
  {
    principle: 'A third thing moved both of them',
    a: {
      title: 'The breakfast club',
      text: 'A school finds that pupils who eat in its breakfast club get better grades than those who do not, and plans to open the club to everyone. The club opens at seven, and the pupils who use it are almost all children whose parents leave for work early and who live close enough to walk.',
    },
    b: {
      title: 'The evening shift',
      text: 'A supermarket finds that tills staffed after six o’clock take more money per hour than tills staffed before noon, and considers moving its best staff to evenings. The store is next to an office block that empties at half past five.',
    },
    criteria: [
      'Name the two things that were found to go together in each case',
      'Name a third thing that would produce both of them on its own',
      'Say what comparison would separate the two explanations',
    ],
    model:
      'In both cases two things were found together and one was treated as the cause of the other, when a third feature of the situation produces both. Home circumstances put a child in the breakfast club AND affect their grades; the time of day fills the shop AND raises what a till takes. The pattern would look exactly as reported even if breakfast did nothing and the staff were identical, so the pattern cannot tell the explanations apart. What would is a comparison where the third thing is held still.',
    key: 'Something else in the situation produces both halves of the pattern',
    decoys: [
      'The samples are too small, so a good deal more data should be gathered before anything is decided',
      'The two things were measured in different ways, so they were never really comparable at all',
      'The people reporting the figures have an incentive to make their own decisions look good',
      'The effect is real but too small to act on',
    ],
    transfer: {
      text: 'A council finds that streets with more trees have less litter, and plans a tree-planting programme to reduce litter.',
      key: 'Check what else is true of the streets that already have trees',
      decoys: [
        'Count the litter again to confirm it',
        'Ask residents on the tree-lined streets whether the trees affect their behaviour',
        'Plant trees on one street and compare it with a street planted at the same time',
        'Check whether litter was counted in the same season on every one of the streets',
      ],
    },
    why: 'The trap is that both patterns are real. Nothing was measured wrongly and nothing was invented; the numbers are exactly as reported. What is missing is any reason to prefer the offered explanation over the one sitting in plain view.',
  },
  {
    principle: 'A third thing moved both of them',
    a: {
      title: 'The reading app',
      text: 'A publisher reports that children who use its reading app read more books than children who do not, and recommends the app to schools. The app costs eleven pounds a month and is bought by parents.',
    },
    b: {
      title: 'The early trains',
      text: 'A rail company notices that its six o’clock services are almost never delayed, while its eight o’clock services often are, and proposes copying the six o’clock schedule. Six o’clock services run before the network is busy.',
    },
    criteria: [
      'Say what the two groups being compared actually differ by, beyond the thing being credited',
      'Explain why the reported pattern would appear even if the intervention did nothing',
      'Say what would have to be held constant to test the claim',
    ],
    model:
      'Both comparisons put two groups side by side that differ in more than one way. Families who buy a subscription differ from families who do not in income, in how much reading already happens at home, and in what they expect of their children — all of which move book counts on their own. Early trains differ from later ones in how much traffic is on the line, which moves delays on its own. So in both cases the difference credited to the intervention has a much larger difference sitting behind it.',
    key: 'The two groups differ in more than the one thing being credited',
    decoys: [
      'The comparison was not repeated often enough for the difference between the groups to be reliable',
      'The measurement used is a poor proxy for the thing that the claim is really about',
      'The difference is genuine but too small to act on',
      'The two groups were measured at different times, so the figures do not line up',
    ],
    transfer: {
      text: 'A gym reports that members who attend its six a.m. class lose more weight than members who attend at lunchtime, and promotes the early class.',
      key: 'Ask how the people who can attend at six already differ',
      decoys: [
        'Compare the two classes on more weeks before drawing any conclusion',
        'Ask the six a.m. members what they think makes the difference',
        'Check whether the two classes are taught by the same instructor',
        'Weigh the members more accurately, using the same scales for both classes',
      ],
    },
    why: 'Choosing to be somewhere is never a random assignment. Whenever a group formed itself, the question is what kind of person ends up in it — and that question usually answers the whole thing.',
  },
]

const compareConfound = tpl(
  {
    id: 'md-cc-confound',
    name: 'Two cases: something else moved both',
    skillIds: ['x-compare'],
    bucket: 'meta',
    difficulty: 3,
    variants: CONFOUND_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => compareItem(rng, cycle(seed, CONFOUND_SETS)),
)

// ------------------------------------------------------------- conjunction

const DETAIL_SETS: CompareSet[] = [
  {
    principle: 'Adding detail makes a story more believable and less likely',
    a: {
      title: 'Two forecasts',
      text: 'A club is asked which is more likely next season: that the team finishes in the bottom half, or that the team finishes in the bottom half after losing its captain to injury in the autumn. Most members choose the second, saying it sounds much more like what would actually happen.',
    },
    b: {
      title: 'Two descriptions',
      text: 'Readers are told about a quiet, orderly person who likes lists, and asked which is more likely: that she works in an office, or that she works in an office and keeps a detailed diary. Most choose the second, because it fits the description better.',
    },
    criteria: [
      'Say what the second option in each case adds to the first',
      'Say what has to happen for the second option to be true, compared with the first',
      'Explain why the second one nevertheless feels more likely',
    ],
    model:
      'In both cases the second option is the first option plus an extra condition. Every situation in which the second is true is also a situation in which the first is true, and there are situations where the first is true and the second is not — so the second cannot be more likely, whatever it feels like. What makes it feel more likely is that the extra detail makes the story fit a picture we already have. Fitting a picture and being probable are different things, and detail pushes the first up while pushing the second down.',
    key: 'The second option is the first one plus a condition, so it cannot be more likely',
    decoys: [
      'The second option is more specific, which makes it easier to check but harder to be sure about',
      'People are simply guessing, because neither of the two options can be worked out at all',
      'The extra detail is irrelevant, so the two options should be treated as equally likely',
      'The second option is more likely, because the detail makes it more realistic overall',
    ],
    transfer: {
      text: 'A weather service asks which is more likely for next Tuesday: rain, or rain arriving in the afternoon after a bright morning.',
      key: 'Rain, because the detailed version is one of its cases',
      decoys: [
        'The detailed version, since forecasters usually describe how the day unfolds',
        'Both equally — the detail is only timing',
        'The detailed version, because a specific forecast is a more useful one',
        'Neither can be judged without knowing the forecaster’s record on similar days',
      ],
    },
    why: 'The detail is not wrong and it is not irrelevant, which is why the two middle decoys are tempting. It is simply an extra thing that also has to be true, and every extra requirement can only narrow the set of ways to be right.',
  },
  {
    principle: 'Adding detail makes a story more believable and less likely',
    a: {
      title: 'The plan that sounds right',
      text: 'Two project plans are put to a committee. One says the work will be finished by June. The other says the work will be finished by June, after a slow start in February and a push through April. The committee finds the second far more convincing and approves it.',
    },
    b: {
      title: 'The explanation that fits',
      text: 'A shop’s takings fell last month. One explanation offered is that fewer people came in. Another is that fewer people came in because the roadworks diverted the bus stop and the weather was poor. Staff find the second obviously right.',
    },
    criteria: [
      'Identify which statement in each pair contains the other one',
      'Say why the longer statement is harder to be right about',
      'Say what makes the longer one feel more convincing anyway',
    ],
    model:
      'Each pair offers a claim and the same claim with machinery attached. The second version can only be true if the first is true AND the added mechanism is the right one, so it has more ways of being wrong. It feels stronger because it explains itself — a story with a mechanism sounds like knowledge — but every added clause is another thing that has to hold. The useful move is to notice that one statement contains the other and then ask what the extra clauses would have to be true for.',
    key: 'One claim contains the other, so the fuller one has more ways to fail',
    decoys: [
      'The fuller claim is better because a claim that explains itself is more useful to act on',
      'The two claims are equivalent, since the extra clauses do not change the conclusion',
      'The shorter claim is too vague to be assessed, so the fuller one has to be preferred',
      'The fuller claim is more likely, because a detailed account is harder to fake',
    ],
    transfer: {
      text: 'A student predicts either that she will pass the exam, or that she will pass the exam by doing well on the first two sections and running out of time on the last.',
      key: 'The plain prediction, since the detailed one needs more to go right',
      decoys: [
        'The detailed prediction, because it shows she understands the structure of the paper',
        'Both are equally likely, since the details are only about how the pass is achieved',
        'The detailed prediction — she knows her patterns',
        'Neither, because predictions about your own performance are unreliable in general',
      ],
    },
    why: 'A story with machinery in it is more useful, more checkable and more interesting. It is also less likely, and confusing the first three properties with the fourth is what the two cases share.',
  },
]

const compareDetail = tpl(
  {
    id: 'md-cc-conjunction',
    name: 'Two cases: the fuller story',
    skillIds: ['x-compare'],
    bucket: 'meta',
    difficulty: 4,
    variants: DETAIL_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => compareItem(rng, cycle(seed, DETAIL_SETS)),
)

// -------------------------------------------------- a test too weak to find

const WEAK_TEST_SETS: CompareSet[] = [
  {
    principle: 'The check was too weak to find the thing it looked for',
    a: {
      title: 'The safety survey',
      text: 'A company surveys eleven of its four hundred staff about a new machine, finds no reports of injury, and states in its annual report that the machine has caused no injuries.',
    },
    b: {
      title: 'The pest inspection',
      text: 'A warehouse manager walks the main aisle once with a torch, sees nothing moving, and records that the building is free of rodents. The stock is stacked six pallets deep on both sides.',
    },
    criteria: [
      'Say what each check would have had to do to find the thing it was looking for',
      'Say whether the check could have found it even if it had been there',
      'Say what the finding of "nothing" is actually evidence about',
    ],
    model:
      'Both cases turn "we did not find it" into "it is not there", and in both the check was incapable of finding it. Eleven people out of four hundred would miss an injury rate that affects one worker in fifty most of the time; one walk down a main aisle cannot see behind six pallets. So the result would have been "nothing found" whether or not there was anything to find, which means it carries no information about the thing at all. Before a negative result means anything, the check has to have been able to come out the other way.',
    key: 'A search that could not have found it tells you nothing about whether it is there',
    decoys: [
      'The people doing the checking were not sufficiently independent of the outcome being reported',
      'The results were recorded honestly but described in wording that overstates them slightly',
      'The checks were carried out at the wrong time of year to detect what was being looked for',
      'The checks are fine and the conclusions drawn from them were simply written too strongly',
    ],
    transfer: {
      text: 'A teacher asks the class "does anyone not understand?", nobody speaks, and she records that the class has understood the topic.',
      key: 'Ask what a confused pupil would have had to do to show up',
      decoys: [
        'Ask the question again at the end of the lesson to give people another chance',
        'Ask the pupils individually rather than in front of the whole class at once',
        'Set a short quiz next lesson to see whether the understanding has lasted',
        'Ask a differently worded question',
      ],
    },
    why: 'The second and third options in the new case are genuinely better practice, and both change the check rather than reading the one that happened. The structural point is about what the existing silence can support, which is nothing.',
  },
  {
    principle: 'The check was too weak to find the thing it looked for',
    a: {
      title: 'The trial that found nothing',
      text: 'A small study of nineteen people finds no difference between a supplement and a dummy pill. A newspaper reports that the supplement has been shown to have no effect.',
    },
    b: {
      title: 'The quiet phone',
      text: 'Someone tests whether their phone rings by leaving it on the table for a minute and watching it. It does not ring, and they conclude the ringer must be broken.',
    },
    criteria: [
      'Say how big or how long each check would have to be to detect what it was after',
      'Explain why "nothing found" was the likely outcome either way',
      'Say what would count as a real test in each case',
    ],
    model:
      'Both draw a conclusion from an absence produced by a check that was never capable of producing anything else. Nineteen people cannot detect a modest effect; a minute of watching cannot detect a phone that rings a few times a day. In both, the honest report is that the question is still open, not that the answer is no. The test that would settle it has to be one where the thing being looked for would actually have turned up.',
    key: 'Not finding it and it not being there are different results',
    decoys: [
      'The study and the test were both carried out correctly but described using the wrong technical vocabulary',
      'Both conclusions are too confident, though the underlying evidence does point in that direction',
      'Both cases suffer from the person checking having an interest in a particular outcome',
      'The measurements are unreliable and need better instruments',
    ],
    transfer: {
      text: 'A student checks whether her program has a bug by running it once on the example from the textbook. It gives the right answer, and she concludes there are no bugs.',
      key: 'Run it on the cases where a bug would actually show',
      decoys: [
        'Run the same example again to make sure the answer is repeatable',
        'Read the program through carefully',
        'Ask someone else to look at the program and give an opinion on it',
        'Add comments to the program so that the logic is easier to follow later',
      ],
    },
    why: 'A single passing example is the same shape as a single quiet minute: the check ran, the result was clean, and the result would have been clean either way. Reading the code and asking a friend are useful and neither of them is a test.',
  },
]

const compareWeakTest = tpl(
  {
    id: 'md-cc-weak-test',
    name: 'Two cases: nothing found, nothing shown',
    skillIds: ['x-compare'],
    bucket: 'meta',
    difficulty: 3,
    variants: WEAK_TEST_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => compareItem(rng, cycle(seed, WEAK_TEST_SETS)),
)

// -------------------------------------------------------------- aggregation

const AGGREGATE_SETS: CompareSet[] = [
  {
    principle: 'The single figure hides groups moving in different directions',
    a: {
      title: 'The department average',
      text: 'A college reports that its overall pass rate fell from 78% to 74% this year and orders a review of teaching. Both of its two departments raised their pass rates. Far more students enrolled in the department with the lower rate.',
    },
    b: {
      title: 'The national wage',
      text: 'A report says average pay in a town fell last year and concludes that workers are worse off. Pay rose in every industry in the town. A large low-paying warehouse opened in the spring and took on four hundred staff.',
    },
    criteria: [
      'Say what the single reported figure is an average over',
      'Say what happened inside each of the groups being averaged',
      'Explain how the overall figure can move against every group',
    ],
    model:
      'In both cases a total is computed across groups whose sizes changed, and the change in sizes moves the total independently of anything happening inside the groups. Every group improved and the mix shifted towards the group with the lower figure, so the overall number fell. The overall number is not wrong; it is answering a different question from the one being asked. Any conclusion about whether things got better or worse has to look at the groups and at how many people are in each.',
    key: 'The mix of group sizes changed, so the total moved against every group',
    decoys: [
      'The overall figure was calculated incorrectly, so the arithmetic should be checked again from the start',
      'The two years used different definitions, so the comparison between them was never valid',
      'The groups are too different from one another to be combined into a single figure at all',
      'The overall change is small enough to be ordinary variation',
    ],
    transfer: {
      text: 'A hospital reports that its overall survival rate for a procedure fell this year, though both of its surgical teams improved. The team that handles the most difficult cases took on many more of them this year.',
      key: 'Look at each team’s rate and how many cases each took',
      decoys: [
        'Check whether the survival rate was measured over the same period in both years',
        'Review the procedure itself, since the overall rate is what patients experience',
        'Compare the hospital against another hospital doing the same procedure',
        'Wait for another year of data',
      ],
    },
    why: 'The trap is that the overall figure is perfectly correct. Nobody miscounted. It simply answers "what happened on average across everyone who turned up", and the people who turned up were not the same people as last year.',
  },
  {
    principle: 'The single figure hides groups moving in different directions',
    a: {
      title: 'The delivery times',
      text: 'A courier reports that its average delivery time got worse this quarter and blames its drivers. City deliveries got faster and rural deliveries got faster. The company took on a large rural contract in October, and rural deliveries take much longer.',
    },
    b: {
      title: 'The two courses',
      text: 'A sixth form reports that the proportion of students getting top grades fell, and questions the teaching. Both of its courses improved their proportion of top grades. Enrolment shifted heavily towards the course where top grades have always been rarer.',
    },
    criteria: [
      'Say which groups the overall figure is being combined from',
      'Say what happened inside each group and what happened to their sizes',
      'Say what someone should look at instead of the single figure',
    ],
    model:
      'Both reports combine two groups whose sizes changed a great deal, and read the combined number as if it described performance. Because the group with the worse baseline grew, the combined figure moves towards that baseline even while both groups improve. Nothing about the drivers or the teaching follows from the combined number at all; the only honest reading is group by group, with the size of each stated alongside it.',
    key: 'The combined number tracks the mix as much as the performance',
    decoys: [
      'The figures for this quarter were gathered under conditions different from those of the previous quarter',
      'The two groups measure slightly different things, so combining them was never appropriate',
      'The change is small enough to be ordinary variation',
      'The people compiling the report had a reason to present the figure in an unflattering way',
    ],
    transfer: {
      text: 'A company reports that the average salary it pays fell this year, though everyone in the company received a pay rise. It opened a new call centre in March.',
      key: 'Look at the pay changes for each group separately',
      decoys: [
        'Check that the rises were actually paid',
        'Compare the company against other companies in the same industry this year',
        'Check whether the average was calculated over the same months in both years',
        'Ask whether some staff left during the year and took higher salaries with them',
      ],
    },
    why: 'The last decoy in the new case is genuinely part of the same mechanism and points at only one half of it. What moved the figure is the whole change in who is being averaged over, which includes the four hundred people who arrived.',
  },
]

const compareAggregate = tpl(
  {
    id: 'md-cc-aggregate',
    name: 'Two cases: the total moved the other way',
    skillIds: ['x-compare'],
    bucket: 'meta',
    difficulty: 4,
    variants: AGGREGATE_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => compareItem(rng, cycle(seed, AGGREGATE_SETS)),
)

// =====================================================================
// x-explain — one sentence, one example, one trap
// =====================================================================

/**
 * Which sentence says what the idea DOES? The two failure modes are circular
 * wording (renaming the idea) and naming its nearest neighbour, and both are
 * represented in every case. Topics are new: the compression family in
 * `meta.ts` already covers the mean, the algebraic variable and the
 * controlled experiment.
 */
interface SentenceCase {
  topic: string
  key: string
  decoys: string[]
  why: string
}

const SENTENCE_CASES: SentenceCase[] = [
  {
    topic: 'a RATIO',
    key: 'How many of one thing there are for each amount of another',
    decoys: [
      'The relationship between two numbers, expressed as a ratio of one to the other',
      'A comparison showing which of two quantities is the larger of the two',
      'A fraction written with a colon instead of a line between the numbers',
      'The difference between two amounts, written in a compact form',
    ],
    why: 'The first decoy uses the word being defined, the second says only which is bigger, the third describes the notation, and the fourth is a subtraction. Only the key says what a ratio lets you DO, which is scale one quantity from another.',
  },
  {
    topic: 'a VARIABLE in an experiment',
    key: 'Something in the setup that could take a different value',
    decoys: [
      'A factor in the experiment that varies while the experiment is being carried out',
      'The thing being measured at the end of the experiment when it finishes',
      'Anything the experimenter can change',
      'A quantity that changes unpredictably and must therefore be controlled',
    ],
    why: 'The first is circular. The second names the outcome variable only. The third describes what CAN be changed, which leaves out everything that varies without you touching it — and that is where confounds live.',
  },
  {
    topic: 'the MEDIAN',
    key: 'The value with as many above it as below',
    decoys: [
      'The value found in the very middle once every value has been put into order',
      'The value halfway between largest and smallest',
      'The typical or most representative value of the whole set of data',
      'The average of the set once the extreme values have been removed',
    ],
    why: 'The first decoy is a procedure rather than a meaning, and it is the version most people learn — which is why the median seems arbitrary. The second is the midrange, the third is vague enough to describe any average, and the fourth is a trimmed mean.',
  },
  {
    topic: 'a HYPOTHESIS',
    key: 'A claim that says in advance what you should see',
    decoys: [
      'An educated guess about what is going to happen in the experiment being run',
      'An idea not yet proved true or false',
      'A theory that a scientist believes to be true and intends to demonstrate',
      'A question that the experiment has been designed in order to answer',
    ],
    why: 'The commonest version is the first, and "educated guess" leaves out the only part that matters: a hypothesis has to commit to an observation in advance, or nothing can count against it.',
  },
  {
    topic: 'PROBABILITY',
    key: 'How often something happens in the long run',
    decoys: [
      'The chance that a particular thing will happen on this specific occasion',
      'A measure of how likely something is, given as a number between nought and one',
      'How confident you feel about an outcome',
      'The proportion of the possible outcomes that count as the one you want',
    ],
    why: 'The last decoy is the definition that works only when every outcome is equally likely, which is why it fails on a biased coin. The second describes the notation and the third replaces the idea with a feeling.',
  },
  {
    topic: 'a FUNCTION',
    key: 'A rule giving exactly one output for each input',
    decoys: [
      'A relationship between two quantities, usually written using letters and symbols',
      'An expression containing an unknown that can be evaluated once it is known',
      'A formula that turns one number into another number by calculating with it',
      'A rule connecting two sets of values',
    ],
    why: '"Exactly one" is the whole idea, and every decoy drops it — which is why the vertical-line test looks like an unrelated fact rather than the definition restated.',
  },
  {
    topic: 'a CONTROL GROUP',
    key: 'The group that shows what happens without the treatment',
    decoys: [
      'A group of participants who do not receive the treatment being tested in the study',
      'A group that keeps the experiment careful',
      'The group that provides the baseline figures for the study before it begins',
      'A group chosen to be as similar as possible to the group being treated',
    ],
    why: 'The first is close and misses the purpose, which is comparison rather than absence. The fourth names a real requirement of a control group and not the thing it is for.',
  },
  {
    topic: 'an AVERAGE RATE',
    key: 'The single steady rate that would take the same total time',
    decoys: [
      'The rate that lies halfway between the fastest and the slowest parts of the journey',
      'The mean of the rates measured on each of the separate stages',
      'The rate you would need to keep up to cover the same distance',
      'A summary of how quickly the whole thing happened, taken over all of it',
    ],
    why: 'The second decoy is the mistake that makes average-speed questions go wrong: averaging the rates ignores that the slow stretch lasts longer and therefore counts for more. The key is the only version that would let you work anything out.',
  },
]

const explainWhatItDoes = tpl(
  {
    id: 'md-ex-what-it-does',
    name: 'Which sentence says what it does?',
    skillIds: ['x-explain'],
    bucket: 'meta',
    difficulty: 3,
    variants: SENTENCE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, SENTENCE_CASES)
    return {
      title: 'One sentence, no jargon',
      prompt: `Compress ${c.topic} into one sentence.\n\nWhich of these actually says what it DOES — rather than renaming it, describing how it is written, or naming its nearest neighbour?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'Cross out any option that uses the word being defined, or a synonym of it. That is circular.',
        'Cross out any option that describes the notation rather than the idea.',
        'Of what is left, ask which one you could act on without already knowing the idea.',
      ],
      explanation: `${c.key}. ${c.why}\n\nThe near neighbours are where the learning is. A definition that cannot tell an idea apart from the thing next to it will hold up until the first question that turns on the difference, which is usually the question worth marks.`,
    }
  },
)

/**
 * Compression as a draft followed by a graded boundary question. Same shape as
 * the existing compression family and deliberately different topics, so the
 * two can both be in rotation without repeating a scenario.
 */
interface CompressCase {
  topic: string
  best: string
  worse: [string, string][]
  model: string
}

const COMPRESS_CASES: CompressCase[] = [
  {
    topic: 'Compress the idea of a PERCENTAGE',
    best: 'A count of how many out of every hundred, so that different-sized groups can be compared',
    worse: [
      ['A number written with a per cent sign after it, showing a portion of something rather bigger.', 'Circular and about the notation — it says how it is written, not what it buys you.'],
      ['The part of a total that you are interested in, out of the whole amount.', 'Near neighbour — that is a fraction, and it drops the fixed denominator that makes percentages comparable.'],
      ['A way of writing a decimal so it is easier for people to read quickly.', 'Near neighbour — true of the notation and silent about what the number means.'],
    ],
    model:
      'One sentence: a percentage is a count out of every hundred, which lets groups of different sizes be compared on the same scale. Example: 18 of 25 and 63 of 90 are 72% and 70%, so the first is slightly better even though it is a smaller count. Non-example: "complaints doubled" is a ratio without a base, which a percentage of a stated total is not. Trap: a percentage of a changed amount is not the same as a percentage of the original, which is why 20% off then 20% on does not return you to the start.',
  },
  {
    topic: 'Compress the idea of a SAMPLE',
    best: 'A smaller group looked at in order to say something about a larger one',
    worse: [
      ['A sample of the population that has been taken in order to study it.', 'Circular — it reuses the word being defined.'],
      ['A small number of people chosen because they are easy to reach.', 'Near neighbour — that is a convenience sample, which is one kind and the least trustworthy kind.'],
      ['A group that has been chosen to be typical of the population being studied.', 'Near neighbour — being typical is what you hope for, not what makes something a sample.'],
    ],
    model:
      'One sentence: a sample is a smaller group examined in order to say something about a larger one. Example: 400 voters asked in order to estimate what several million think. Non-example: asking everyone in the country is a census, not a sample. Trap: the value of a sample comes from HOW it was chosen, not from how big it is — a hundred thousand self-selected replies say less than a thousand chosen at random.',
  },
  {
    topic: 'Compress the idea of an EQUATION',
    best: 'A statement that two things are the same size, which constrains what the unknown can be',
    worse: [
      ['A mathematical sentence with an equals sign in the middle of it.', 'About the notation — it describes what an equation looks like rather than what it does.'],
      ['A rule that tells you how to calculate one quantity from another.', 'Near neighbour — that is a formula, which is used in one direction; an equation constrains.'],
      ['A problem that has to be worked through carefully in order to find the missing number in it.', 'Near neighbour — that is what you often do WITH one, and plenty of equations have nothing missing.'],
    ],
    model:
      'One sentence: an equation says two things are the same size, and that constraint is what pins down the unknown. Example: 3x + 4 = 19 is only true when x is 5, so the statement itself rules out every other value. Non-example: 3x + 4 is an expression — nothing is being claimed, so nothing is constrained. Trap: whatever is done to one side must be done to the other, because the claim being preserved is the sameness, not the arithmetic.',
  },
  {
    topic: 'Compress the idea of CORRELATION',
    best: 'Two things tending to move together, without saying why they do',
    worse: [
      ['A correlation between two variables, meaning they are related to one another.', 'Circular — it renames the idea instead of saying what it reports.'],
      ['One thing causing another thing to change along with it.', 'Near neighbour — that is causation, and merging the two is the commonest error there is.'],
      ['A pattern showing that two measurements are almost exactly the same.', 'Near neighbour — that is agreement between measures; correlation is about moving together, not matching.'],
    ],
    model:
      'One sentence: a correlation says two things tend to move together, and says nothing about why. Example: ice-cream sales and drowning deaths rise together, because both rise with temperature. Non-example: a thermometer reading in Celsius and the same reading converted to Fahrenheit are not correlated in any useful sense — they are the same measurement twice. Trap: a correlation is consistent with the first causing the second, the second causing the first, a third thing causing both, or the pattern being a fluke.',
  },
]

const explainCompress = tpl(
  {
    id: 'md-ex-compress',
    name: 'Compress it, then defend the boundary',
    skillIds: ['x-explain'],
    bucket: 'meta',
    difficulty: 3,
    variants: COMPRESS_CASES.length,
    minutes: 5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, COMPRESS_CASES)
    return {
      title: 'One sentence, one example, one trap',
      prompt: `${c.topic}.`,
      parts: [
        part('Compress', {
          prompt: `Write all four from your own head — the model appears once you are done.\n\n1. **One sentence** — the idea, with no jargon and without using its own name\n2. **One example** — with actual numbers or objects in it\n3. **One non-example** — something people confuse it with\n4. **One trap** — the mistake newcomers make`,
          answer: draft({
            criteria: [
              'A sentence stating what the idea DOES, without circular wording',
              'A concrete example with actual numbers or objects',
              'A non-example aimed at a real confusion rather than a random wrong thing',
              'A trap describing a mistake someone would really make',
            ],
            model: c.model,
            minWords: 30,
            placeholder: 'One sentence… Example… Non-example… Trap…',
          }),
          explanation:
            'Compression is a test disguised as note-taking: every gap shows up as a sentence you cannot finish. This part is never scored — the app cannot read writing, and marking it would be pretending. The next part is the graded one.',
          hints: [
            'If the sentence needs the idea’s own name to work, it is circular. Say what it DOES.',
            'The non-example is the hard one. Pick the nearest neighbour people actually confuse it with.',
          ],
        }),
        part('Boundary', {
          prompt:
            'Now the graded part. Which one-sentence version actually says what the idea does — rather than renaming it, describing the notation, or naming its nearest neighbour?',
          answer: mcq(rng, c.best, c.worse.map(([t]) => t)),
          explanation: `${c.best}\n\nWhy the others fail:\n${c.worse.map(([t, why]) => `- "${t}" — ${why}`).join('\n')}\n\nBoundaries are what define a concept. The near neighbours are where the actual learning is, which is why writing the non-example was worth the effort.`,
        }),
      ],
      hints: [
        'Start from what the idea DOES, not from what it is called.',
        'If the sentence will not form, that is the finding — note exactly where it breaks.',
        'For the graded part: cross out anything you could not act on without already knowing the idea.',
      ],
      explanation: `Model: ${c.model}\n\nWriting the compression before seeing the model is the part that does the work. Reading a good explanation is smooth and produces very little; producing one badly and then seeing where it fell short produces a list of exactly what you did not know.`,
    }
  },
)

/**
 * The trap, specifically. Most explanations end with a warning nobody needed,
 * because the author is warning against the thing that is easy to say rather
 * than the thing people actually do.
 */
interface TrapCase {
  topic: string
  key: string
  decoys: string[]
  why: string
}

const TRAP_CASES: TrapCase[] = [
  {
    topic: 'someone learning to find a percentage of an amount',
    key: 'Taking the percentage of the wrong number',
    decoys: [
      'Forgetting that percentages have to be written with a per cent sign',
      'Not knowing that per cent means "out of a hundred" in the first place',
      'Being unable to convert a percentage into its decimal form',
      'Confusing percentages with fractions',
    ],
    why: 'Identifying which amount is the base is the step that decides the answer and the step nobody is taught to check. The other four are things people are told and rarely get wrong once told.',
  },
  {
    topic: 'someone learning to solve two-step equations',
    key: 'Undoing the operations in the order they appear',
    decoys: [
      'Not knowing that the same must be done to both sides of an equation',
      'Forgetting which operation undoes which',
      'Being unable to write the answer in the right form at the end',
      'Confusing an equation with an expression when reading the question',
    ],
    why: 'Order is the trap because it is invisible: undoing in reading order feels natural and produces a wrong answer that looks like a careful one.',
  },
  {
    topic: 'someone learning to read a line graph',
    key: 'Reading the steepness as the size of the value',
    decoys: [
      'Not knowing which of the two axes is the horizontal one',
      'Being unable to read a value that falls between two gridlines',
      'Forgetting to look at the title of the graph before reading it',
      'Confusing a line graph with a bar chart when they appear together',
    ],
    why: 'A steep line means fast change and a high line means a large value, and mixing them is the error that survives into adulthood because nothing on the page distinguishes them.',
  },
  {
    topic: 'someone learning what a control group is for',
    key: 'Thinking the control group is the one that gets nothing',
    decoys: [
      'Not knowing that experiments usually have more than one group in them',
      'Being unable to say how large a control group ought to be',
      'Forgetting to mention the control group when writing up the method',
      'Confusing the control group with the sample that was selected',
    ],
    why: 'A control group is often given something — a dummy pill, the existing method — because the point is a comparison, and "the group that gets nothing" quietly turns it into an absence instead.',
  },
  {
    topic: 'someone learning to use a dictionary definition in an essay',
    key: 'Quoting the definition instead of using it',
    decoys: [
      'Not knowing which dictionary is the most authoritative one to use',
      'Forgetting to say which dictionary the definition came from',
      'Being unable to find the word at all',
      'Confusing two entries where the word has several meanings',
    ],
    why: 'The definition in the opening line is the classic wasted paragraph, and it happens because quoting feels like using. The last decoy names a real difficulty and it is one people notice and fix.',
  },
  {
    topic: 'someone learning to calculate an average',
    key: 'Averaging averages as though the groups were equal',
    decoys: [
      'Forgetting to divide by the number of values at the end',
      'Not knowing whether to include a zero in the count of values',
      'Being unable to add up a long list of numbers accurately',
      'Confusing the mean with the median when both are asked for',
    ],
    why: 'Averaging two class averages to get a year average is wrong whenever the classes differ in size, and it looks so reasonable that it is rarely checked. Mean and median confusion is real and it is a labelling problem people can be told out of.',
  },
  {
    topic: 'someone learning to use a formula from a formula sheet',
    key: 'Choosing a formula the problem cannot feed',
    decoys: [
      'Not knowing where the formula sheet is kept during the exam',
      'Being unable to read the symbols',
      'Forgetting to write the formula down before substituting',
      'Confusing two formulas that appear next to each other',
    ],
    why: 'The formula sheet removes memory as an obstacle and leaves selection, which is the part it does not help with. A formula that needs a quantity the problem never gives is unusable however well it is remembered.',
  },
  {
    topic: 'someone learning to summarise a source',
    key: 'Summarising what it says instead of what it claims',
    decoys: [
      'Not knowing how long a summary is supposed to be',
      'Being unable to identify the most important paragraph in it',
      'Forgetting to note down where the source came from',
      'Confusing the author with a person quoted inside the text',
    ],
    why: 'A summary that lists topics covered is the commonest weak summary, and the fix is to state the claim being made. The last decoy is a real and frequent error, and it is one people correct as soon as it is pointed out once.',
  },
]

const explainRealTrap = tpl(
  {
    id: 'md-ex-real-trap',
    name: 'Which trap is the real one?',
    skillIds: ['x-explain'],
    bucket: 'meta',
    difficulty: 2,
    variants: TRAP_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, TRAP_CASES)
    return {
      title: 'The warning worth giving',
      prompt: `You are explaining something to ${c.topic}, and you have room for one warning.\n\nWhich trap is worth the space?`,
      answer: mcq(rng, c.key, [...c.decoys]),
      hints: [
        'A warning is worth giving only if someone would fall into it after hearing the explanation.',
        'Cross out anything people get right as soon as they are told it once. That is information, not a trap.',
        'The best traps are the ones where the wrong move feels more natural than the right one.',
      ],
      explanation: `${c.key}. ${c.why}\n\nMost explanations end with a warning against something obvious, because obvious things are easy to write. A trap earns its place when the wrong move feels natural, when nothing on the page marks it, and when it produces an answer that looks careful. Working out which one that is forces you to think about how the idea fails, which is a different and more useful question than how it works.`,
    }
  },
)

/**
 * Examples, non-examples and restatements. The non-example is the part
 * learners drop, and the reason is that "something it is not" is easy while
 * "the nearest thing it is not" is hard. Sorting all three forces the
 * distinction.
 */
interface ExampleSortCase {
  topic: string
  examples: string[]
  nonExamples: string[]
  restatements: string[]
  why: string
}

const EXAMPLE_SORT_CASES: ExampleSortCase[] = [
  {
    topic: 'a FAIR TEST (changing one thing and holding the rest steady)',
    examples: [
      'Two identical plants, same soil and water, one given fertiliser',
      'Two batches of the same dough, same oven, different baking times',
    ],
    nonExamples: [
      'Two plants given different fertiliser, one on a windowsill and one in a cupboard',
      'This year’s exam results compared with last year’s, after the syllabus changed',
    ],
    restatements: [
      'A test in which the experiment has been made fair for everyone taking part',
      'An experiment that has been designed to give a fair and accurate result',
    ],
    why: 'The non-examples are near misses: both are real comparisons and both change more than one thing. The restatements use "fair" to explain "fair test", which teaches nothing.',
  },
  {
    topic: 'a RATE (how much of one thing per unit of another)',
    examples: [
      'Ninety pence per litre',
      'Twelve pages read in an hour',
    ],
    nonExamples: [
      'Three litres of petrol in the tank',
      'Two hundred pages in the whole book',
    ],
    restatements: [
      'The rate at which something happens over a period of time',
      'A measurement showing how fast something is going along',
    ],
    why: 'The non-examples are amounts rather than rates, which is the actual confusion. The second restatement sounds like an explanation and only covers speed, which is one rate out of many.',
  },
  {
    topic: 'an INFERENCE (a conclusion drawn from what was observed)',
    examples: [
      'The pavement is wet, so it probably rained overnight',
      'The bread has risen, so the yeast was still active',
    ],
    nonExamples: [
      'The pavement is wet',
      'The bread has risen by about four centimetres',
    ],
    restatements: [
      'An inference that a person makes about something they have seen',
      'A conclusion reached by a process of careful reasoning',
    ],
    why: 'The non-examples are observations, which is exactly the boundary being taught: they are what an inference is built on and are not inferences themselves.',
  },
  {
    topic: 'a VARIABLE COST (one that changes with how much you produce)',
    examples: [
      'The flour used per loaf baked',
      'The postage paid per order sent',
    ],
    nonExamples: [
      'The monthly rent on the bakery',
      'The one-off cost of the oven',
    ],
    restatements: [
      'A cost that is variable rather than fixed in nature',
      'An amount of money that changes from time to time',
    ],
    why: 'The non-examples are fixed costs, which is the pair the idea exists to distinguish. The second restatement is broad enough to include a rent rise, which is not what "variable" means here.',
  },
  {
    topic: 'a RANDOM SAMPLE (every member equally likely to be chosen)',
    examples: [
      'Numbering all 800 pupils and drawing 50 numbers blindly',
      'Selecting every twentieth name from a complete list in random order',
    ],
    nonExamples: [
      'Asking the first fifty pupils who arrive at school',
      'Posting a survey online and using whoever replies',
    ],
    restatements: [
      'A sample that has been chosen at random from the population',
      'A group picked without the researcher choosing who is in it',
    ],
    why: 'Both non-examples feel unplanned and are not random: arriving early and choosing to reply are both related to what is being measured. The second restatement is the near miss — not choosing deliberately is not the same as everyone being equally likely.',
  },
  {
    topic: 'a COUNTEREXAMPLE (a single case that shows a claim is false)',
    examples: [
      'One even prime number, against "all primes are odd"',
      'One swan that is not white, against "all swans are white"',
    ],
    nonExamples: [
      'A study finding that most primes above two are odd',
      'A survey finding that ninety-nine per cent of swans are white',
    ],
    restatements: [
      'An example that runs counter to what has been claimed',
      'A case that a person puts forward in order to argue against something',
    ],
    why: 'The non-examples are supporting evidence for a weaker claim, which is what people offer when asked for a counterexample. One case is enough to break a universal claim, and no amount of agreement can establish one.',
  },
]

const explainExampleSort = tpl(
  {
    id: 'md-ex-example-sort',
    name: 'Example, boundary, or just a restatement?',
    skillIds: ['x-explain'],
    bucket: 'meta',
    difficulty: 3,
    variants: EXAMPLE_SORT_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, EXAMPLE_SORT_CASES)
    return {
      title: 'Three jobs a sentence can do',
      prompt: `You are explaining **${c.topic}**.\n\nSort each candidate. An example shows the idea working. A non-example marks the boundary against the thing people confuse it with. A restatement just says the idea again in different words.`,
      answer: classify(
        rng,
        ['Example', 'Non-example that marks the boundary', 'Just a restatement'],
        [
          ...c.examples.map((text) => ({ text, category: 0 })),
          ...c.nonExamples.map((text) => ({ text, category: 1 })),
          ...c.restatements.map((text) => ({ text, category: 2 })),
        ],
      ),
      hints: [
        'A restatement can be spotted by a test: does it use the idea’s own name, or a synonym of it, to do the explaining?',
        'A good non-example is the nearest thing that is NOT the idea, not something randomly unrelated.',
        'Ask what each sentence would teach someone who does not have the idea yet. Restatements teach nothing.',
      ],
      explanation: `**Examples:** ${c.examples.join('; ')}.\n\n**Non-examples marking the boundary:** ${c.nonExamples.join('; ')}.\n\n**Restatements:** ${c.restatements.join('; ')}.\n\n${c.why}\n\nAn explanation with examples and no non-examples leaves the boundary undrawn, and the boundary is where questions get set. Restatements are the most common filler in explanations because they feel like content while adding none — and the way to catch one is to check whether it could be understood by someone who did not already know the answer.`,
    }
  },
)

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
  methodNameIt,
  methodFourWay,
  methodLooksLike,
  methodSortStems,
  methodCues,
  focusCauseSort,
  focusCure,
  focusRecurring,
  focusBlockOrder,
  focusBudget,
  calibEvidenceMatch,
  calibDontKnow,
  calibTrackRecord,
  calibSortRecords,
  calibSupportedClaims,
  learnWhyRetrieval,
  learnSpacingPlan,
  learnNotSupported,
  learnTierSort,
  learnLimits,
  desirableWhichPays,
  desirableRemoveIt,
  desirableAddMulti,
  desirableRoutineOrder,
  transferNounFree,
  transferMatchMulti,
  transferWhyReminded,
  transferNewDomain,
  compareConfound,
  compareDetail,
  compareWeakTest,
  compareAggregate,
  explainWhatItDoes,
  explainCompress,
  explainRealTrap,
  explainExampleSort,
]
