/**
 * Spontaneity probes: does a taught rule fire when nothing points at it?
 *
 * WHY THIS FILE EXISTS. Every other item in the bank announces its own topic.
 * A proportional-reasoning question served during proportional-reasoning
 * practice tells the learner which method to reach for before they have read
 * it, so a correct answer shows the method can be EXECUTED, not that it would
 * be SELECTED. RESEARCH.md §41c records the gap: Gick & Holyoak found about 30%
 * solve after reading a structurally identical story and 75-80% once told to
 * use it, so roughly two thirds of people who already hold the answer never
 * retrieve it. Detterman's standard, quoted in Barnett & Ceci: "Telling
 * subjects to use a principle is not transfer. It is following instructions."
 *
 * THE THREE RULES EVERY ITEM HERE OBEYS. Break any one of them and the probe
 * stops measuring spontaneity and goes back to measuring execution:
 *
 * 1. **No naming.** The prompt never contains the name of the principle, nor a
 *    recognisable stock phrase from its own teaching. No "base rate", no
 *    "expected value", no "dominated option", no "reference class". The audit
 *    beside this file pins that with a banned-word list, because it is exactly
 *    the kind of thing that erodes one careless edit at a time.
 * 2. **Several ideas are live.** Options name real, taught moves that a
 *    reasonable learner might pick. A probe whose wrong answers are obviously
 *    silly is a reading test.
 * 3. **"Nothing here applies" is a real answer.** Some variants ARE plain
 *    situations where none of the taught moves is the right tool, and the key
 *    says so. Without those, the probe teaches that there is always a technique
 *    to reach for, which is its own bad habit and would make the whole set
 *    guessable by never picking that option.
 *
 * THESE NEVER MOVE THE LADDER. `spontaneous: true` marks them, and
 * `engine/spontaneity.ts` reports them separately. A probe that counted toward
 * mastery would be a probe the planner starts optimising for, and the number
 * would stop meaning anything — the same reasoning that keeps placement out of
 * the evidence ladder.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'
import type { Rng } from '../../engine/rng'

interface Probe {
  /** The situation. Must not name any method. */
  scene: string
  /** The move that actually fits, or the honest refusal. */
  correct: string
  /** Other taught moves, each plausible on a quick read. */
  wrong: string[]
  /** Which taught idea this was probing, revealed only afterwards. */
  names: string
  why: string
}

// --------------------------------------------------------------- everyday set

const EVERYDAY: Probe[] = [
  {
    scene:
      'A revision app says 90% of students who used it every day for a term improved their grades. You are deciding whether to use it.',
    correct: 'Ask what happened to the students who started it and did not keep going every day',
    wrong: [
      'Ask how much the grades improved on average, since 90% could mean a tiny change',
      'Ask whether the students were already strong before they started using it',
      'Ask how many students there were in total, since a small group proves little',
      'Nothing here needs checking — that is a straightforward claim about results',
    ],
    names: 'survivorship — the group you can see was selected by the very thing being measured',
    why: 'The claim is only about students who kept going for a whole term, and keeping going is exactly the thing that would predict improvement anyway. The missing group is the one that quit. All three other questions are worth asking and none of them touches the mechanism: you could get satisfying answers to every one and still be looking at a filtered group.',
  },
  {
    scene:
      'A screening test for a rare condition is right 95% of the time. Someone you know tests positive and is frightened. About one person in a thousand actually has the condition.',
    correct: 'Work out how many in a thousand test positive, and how many of those have it',
    wrong: [
      'Point out that 95% is not certainty, and that a second test would be a sensible thing to run',
      'Explain that a 95% accurate test means a 5% chance the result is wrong here',
      'Suggest waiting for symptoms, since the test cannot be conclusive on its own',
      'Nothing here needs working out — a positive result on a good test is bad news',
    ],
    why: 'Out of a thousand people, one has it and about 50 do not but test positive anyway. So a positive result is mostly a false one — the frightening number and the true number point in opposite directions. The second option is the tempting one because it is nearly right and completely misses this: "5% chance the result is wrong" is not what the 95% describes.',
    names: 'counting people rather than percentages, and the base rate underneath a test result',
  },
  {
    scene:
      'You have been queueing for twenty-five minutes for a stall. Someone tells you the queue at a second stall selling the same thing is about five minutes long.',
    correct: 'Move, because the twenty-five minutes are gone whichever queue you stand in',
    wrong: [
      'Stay, because you have already invested twenty-five minutes in this queue',
      'Stay, because the other queue is probably short for a reason worth knowing',
      'Move, but only if you can check the second queue is genuinely selling the same thing',
      'Nothing here needs deciding — five minutes against twenty-five is not a close call',
    ],
    names: 'what is already spent is not part of the decision',
    why: 'The only question is what happens from here: five more minutes or however many are left. The twenty-five are unrecoverable in both branches. The third option is interesting because it is genuinely sensible advice and it is not what the situation turns on — checking is cheap and it is not the reason to move.',
  },
  {
    scene:
      'Your class is voting on where to go for a trip. You would like the museum, and everyone you have spoken to about it agrees the museum is obviously the best option.',
    correct: 'Notice that the people you have spoken to are not a fair sample of the class',
    wrong: [
      'Take it as a good sign, since several independent people reached the same view',
      'Ask more people to be sure, since a bigger sample gives a more reliable answer',
      'Propose the museum confidently, since it appears to be what the class wants',
      'Nothing here needs noticing — asking people what they think is how you find out',
    ],
    names: 'your own circle is not the room, and the people you ask are selected by how you know them',
    why: 'You talked to the people you talk to, and they are more like you than the class is. Asking more of the same people makes the estimate more confident and no more accurate, which is why the second option is worse than it looks — it treats the problem as a sample-size problem when it is a selection problem.',
  },
  {
    scene:
      'A friend says they have found a system for a game: they have won four times in a row using it, out of the six times they have tried.',
    correct: 'Ask how many people tried something similar and stopped after losing',
    wrong: [
      'Ask what the system actually is, since a system that works should be explicable',
      'Point out that six attempts is far too few to conclude anything at all',
      'Try it yourself a few times and see whether you get similar results from it',
      'Nothing here needs asking — four wins in six is a result worth taking seriously',
    ],
    names: 'the reference class, and who you never hear from',
    why: 'The second option is genuinely correct and is not the sharpest tool here — a small sample would be a problem even if you were seeing every attempt, and you are not. Somebody wins four in six by chance often enough, and those are the people who tell you about their system. The people whose system lost are not having this conversation.',
  },
  {
    scene:
      'You are told the school will fund whichever club submits the best proposal, and that the judges are two teachers who have both said publicly that they want more sport at the school.',
    correct: 'Write the proposal for the two people who will actually read it',
    wrong: [
      'Write the strongest proposal purely on its merits, since that is what "best" is supposed to mean here',
      'Point out to the school that the judging panel is not neutral about this',
      'Submit a sports-adjacent proposal regardless of what your club actually does',
      'Nothing here needs adjusting — a good proposal is a good proposal either way',
    ],
    names: 'work out what the last move is before you make the first one',
    why: 'The decision is made by two named people with a stated view, so "best" is whatever they judge best. That is not cynicism and it is not a licence for the third option, which is a lie about your own club. Writing honestly for the actual audience is the move. The second option is worth doing and does not help you this week.',
  },
]

// ------------------------------------------------------- the honest-null set
//
// Situations where the right answer is that no clever move applies. Without
// these the probe would be beatable by never picking "nothing applies", and it
// would quietly teach that every situation hides a technique.

const PLAIN: Probe[] = [
  {
    scene:
      'You need to be at a friend\'s house by four. The walk takes twenty minutes and it is currently half past three.',
    correct: 'Nothing clever applies here — leave in about ten minutes and walk',
    wrong: [
      'Leave now, since arriving early costs nothing and being late costs something',
      'Work out how often you have been late before and plan around that record',
      'Check whether the twenty minutes is your own estimate or somebody else\'s',
      'Consider what your friend would infer from each possible arrival time',
    ],
    names: 'knowing when NOT to reach for anything',
    why: 'Every wrong option is a real move taught in this app, applied where it earns nothing. The second is a genuinely useful habit and pointless over a twenty-minute walk you have done before. Recognising an ordinary situation is part of the skill: a method used everywhere is a method that has stopped carrying information.',
  },
  {
    scene:
      'Two shops sell the same drink. One is 90p and the other is £1.10, and both are on your way home.',
    correct: 'Nothing clever applies here — buy the cheaper one and get on with your day',
    wrong: [
      'Ask why the cheaper one is cheaper, since a price difference usually means something',
      'Consider that the dearer shop may know something about the product you do not',
      'Work out whether a 20p saving is worth the thought you are giving it',
      'Check whether the first price you saw is colouring how the second one looks',
    ],
    names: 'knowing when NOT to reach for anything',
    why: 'The first two options are the winner\'s-curse habit fired at nothing: identical goods, visible prices, no hidden information. The third is nearly a joke and nearly right — the point at which you notice you are over-thinking 20p is a genuine skill, and the honest version of it is simply buying the cheaper one.',
  },
  {
    scene:
      'A friend asks whether you want to come to the cinema on Saturday. You are free and you want to go.',
    correct: 'Nothing clever applies here — say yes, since you are free and you want to',
    wrong: [
      'Ask what else they might be planning, so you can compare it against other options',
      'Consider what they would read into an immediate yes rather than a considered one',
      'Wait and see whether a better invitation turns up before committing',
      'Ask who else is going, since that changes what the evening will actually be like',
    ],
    names: 'knowing when NOT to reach for anything',
    why: 'The second option is the mind-reading habit doing damage: there is no puzzle about what they meant, and inventing one costs a friendship a little. The fourth is a perfectly normal question in real life and it is not a reasoning move — the situation simply does not need analysing.',
  },
]

// ----------------------------------------------------- reachable at any level
//
// Both original probes sat at difficulty 4, and a simulated year measured the
// consequence: a struggling learner met ZERO of them in 365 days and a
// 15-minute learner met two, against the five the readout needs before it will
// speak. The feature was invisible for most of the people it was built for, and
// the failure was silent — the panel simply never appears.
//
// Being unprompted is not the same as being hard. These carry the same three
// rules at difficulty 2 and 3 so the measurement exists across the range.

const EASY: Probe[] = [
  {
    scene:
      'A shop sign says "up to 70% off". You go in and most things are 10% off, with one shelf at 70%.',
    correct: 'Nothing here needs challenging — "up to" means exactly what happened',
    wrong: [
      'The shop is being misleading, since almost nothing is actually at 70% off',
      'Check whether the 70% shelf was stocked before the sign went up outside',
      'Ask how the average discount across the shop compares with the headline',
      'Work out whether the 10% items were marked up before the sale started',
    ],
    names: 'reading a claim for what it actually says',
    why: 'The claim is technically exact and deliberately shaped to be read as more. The move is noticing the difference without inventing a scandal — the other options all assume wrongdoing and go looking for it, which is a habit that costs you as often as it saves you.',
  },
  {
    scene:
      'You are told a bag holds 3 red and 7 blue counters. You draw one without looking.',
    correct: 'It is more likely blue, and that is all anyone can say about this draw',
    wrong: [
      'It will probably be blue, so if it comes out red something is off',
      'Draw several times first to establish what the bag actually contains',
      'Consider that the last few draws affect what is likely to come next',
      'Nothing here needs judging, since a single draw could come out either colour',
    ],
    names: 'a probability is about the draw, not a prediction of it',
    why: 'The last option is the tempting one and it is wrong in an interesting way: "could be either" is true and does not stop one being more likely. The third is the gambler\'s error, and the first turns a likelihood into an expectation that a red result would violate.',
  },
  {
    scene:
      'Two friends both say they will "be there around seven". One has never been late; the other is late most times.',
    correct: 'Expect them at different times, because their records differ',
    wrong: [
      'Expect them both at seven, since that is what they each said',
      'Expect them both late, since "around seven" is vague from anybody',
      'Ask them both to confirm an exact time so there is no ambiguity',
      'Nothing here needs working out — they will each arrive when they arrive',
    ],
    names: 'what someone has actually done beats what they have said',
    why: 'Identical words, different evidence behind them. The second option throws away the difference by being cynical about both, which feels safer and is just as wrong as being credulous about both.',
  },
  {
    scene:
      'You get a message from an unknown number saying a parcel is held and asking you to confirm your address on a link.',
    correct: 'Do not use the link — check with the delivery company through their own site',
    wrong: [
      'Reply asking which parcel it is, so you can work out whether it is genuine',
      'Check whether the link looks like the real company address before opening it',
      'Ignore it entirely, since a real delivery company would phone rather than text',
      'Nothing here needs special care — confirming an address gives away very little',
    ],
    names: 'go around the message rather than through it',
    why: 'The whole point is not to evaluate the message on its own terms, which is what the first two do — a convincing message is easy to make and the check costs nothing. Note the option saying nothing special is needed: an address alone feels harmless and is exactly the sort of confirmation these messages are collecting, which is why "nothing applies" is the wrong call here even though it is the right call elsewhere in this set.',
  },
  {
    scene:
      'Your team lost, and afterwards someone says "we always lose when you play in defence".',
    correct: 'Ask how many games that is, and how the team did in the ones you did not',
    wrong: [
      'Accept it, since the person watching from the side sees things you cannot',
      'Reject it, since one person\'s impression of a season is not worth much',
      'Offer to play elsewhere for a few games to see whether it makes a difference',
      'Nothing here needs answering — a comment right after a loss is just frustration',
    ],
    names: 'a comparison needs the other half of the table',
    why: 'The third option is genuinely a good idea and it is a slower version of the same question. The claim compares two groups and only one has been described, so the number of games and the record without you are the whole of what would settle it.',
  },
]

const MEDIUM: Probe[] = [
  {
    scene:
      'A club has to choose between two dates. Six people prefer Thursday and four prefer Saturday, but the four cannot come at all on Thursday while the six merely mind.',
    correct: 'Saturday, because "cannot" and "would rather not" are not the same thing',
    wrong: [
      'Thursday, since more people prefer it and that is what a vote is for',
      'Thursday, but move it to Saturday next time so it evens out fairly',
      'Ask everyone to vote again now that the numbers are known to all',
      'Nothing here needs deciding — a majority preference settles it',
    ],
    names: 'counting heads hides how much each head cares',
    why: 'Six mild preferences against four absolute constraints is not ten votes. The second option is the interesting near-miss: alternating is fair over time and does nothing about the four people missing this one entirely.',
  },
  {
    scene:
      'Someone shows you a graph where a line rises steeply. The vertical axis runs from 98 to 102.',
    correct: 'Redraw it from zero in your head before deciding anything has risen steeply',
    wrong: [
      'Take the rise seriously, since the data points are presumably accurate',
      'Ask what the units are, since a small change can matter a great deal',
      'Ask over what period the change happened before judging its size',
      'Nothing here needs adjusting — a graph shows what the numbers do',
    ],
    names: 'the axis is a choice, and it is doing the persuading',
    why: 'The second and third options are both real questions and neither touches the mechanism: the shape of the line was chosen before you saw it. Note the data may be perfectly honest — a truncated axis is often the right way to show a small real change, which is why the move is to redraw rather than to disbelieve.',
  },
  {
    scene:
      'You are picking a queue at a supermarket. One has three people with full trolleys; another has six with baskets.',
    correct: 'The number of people is the wrong thing to be counting here',
    wrong: [
      'Take the shorter queue, since fewer people is usually faster',
      'Take the longer queue, since baskets always clear faster than trolleys',
      'Watch both for a moment and join whichever is visibly moving faster',
      'Nothing here needs working out — the difference will be seconds either way',
    ],
    names: 'counting the wrong unit',
    why: 'The third option is genuinely good practical advice and it sidesteps the question rather than answering it. What matters is items and transactions, not bodies — and the honest follow-up is that six baskets may still lose to three trolleys, which is why the answer names the error rather than picking a queue.',
  },
  {
    scene:
      'A rule at school changed and almost everyone dislikes it. Someone proposes that everyone stops following it at once, so nobody can be singled out.',
    correct: 'That only works if everyone can see that everyone else is going to do it',
    wrong: [
      'That works, since a rule nobody follows cannot really be enforced',
      'That will not work, because someone always breaks ranks under pressure',
      'That is unwise regardless, since the risk falls unevenly across the group',
      'Nothing here needs analysing — either people do it or they do not',
    ],
    names: 'a plan needing everyone to move at once needs shared visibility, not just shared opinion',
    why: 'The third option is a fair objection and a different one. What the proposal actually turns on is whether the agreement is visible: privately everyone dislikes the rule already, and that has changed nothing. The plan needs each person to know the others know.',
  },
]

/**
 * One pool, deliberately.
 *
 * These began as two templates — situations with a method, and situations
 * without one — and that split was itself a giveaway: the "nothing applies"
 * answer was correct in every variant of the second and none of the first, so
 * recognising which template you were looking at answered the question. Both
 * templates now draw from the same mixed pool at different offsets.
 */
const POOL: Probe[] = [...EVERYDAY, ...PLAIN]
/** Difficulty 2 and 3 pools, each carrying its own "nothing applies" keys. */
const EASY_POOL: Probe[] = [...EASY, PLAIN[0], PLAIN[1]]
const MID_POOL: Probe[] = [...MEDIUM, PLAIN[2], PLAIN[0]]

/**
 * One body for every probe.
 *
 * The three rules live in the audit, but the WORDING that tells a learner these
 * do not count lives here — and it has to be identical everywhere, because a
 * probe that quietly failed to say it would be the app keeping a measurement
 * secret from the person being measured.
 */
function probeBody(rng: Rng, c: Probe) {
  return {
    title: 'Unprompted',
    prompt: `${c.scene}

What is the most useful thing to do here?`,
    answer: mcq(rng, c.correct, c.wrong),
    hints: [
      'There is no topic heading on this one on purpose. Read the situation before reaching for anything.',
      'Several of these are sensible moves. The question is which one touches what actually makes this situation tricky.',
      'One of the options is that nothing special applies. Sometimes that is the right answer.',
    ],
    explanation: `**${c.correct}**

${c.why}

**The idea being probed:** ${c.names}.

These questions never name their topic, and that is the whole point of them. Answering correctly inside a topic's own practice shows you can run the method. This asks whether you would have reached for it with nothing pointing the way — which is the harder thing and the one that matters outside the app. **These do not count toward your progress on any skill**; they are reported on their own.`,
  }
}

const everydayProbe = tpl(
  {
    id: 'sp-everyday',
    name: 'Nothing tells you which idea to use',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 4,
    variants: EVERYDAY.length + PLAIN.length,
    minutes: 3,
    spontaneous: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, POOL)
    return {
      title: 'Unprompted',
      prompt: `${c.scene}\n\nWhat is the most useful thing to do here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'There is no topic heading on this one on purpose. Read the situation before reaching for anything.',
        'Several of these are sensible moves. The question is which one touches what actually makes this situation tricky.',
        'One of the options is that nothing special applies. Sometimes that is the right answer.',
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\n**The idea being probed:** ${c.names}.\n\nThese questions never name their topic, and that is the whole point of them. Answering correctly inside a topic's own practice shows you can run the method. This asks whether you would have reached for it with nothing pointing the way — which is the harder thing and the one that matters outside the app. **These do not count toward your progress on any skill**; they are reported on their own.`,
    }
  },
)

const plainProbe = tpl(
  {
    id: 'sp-plain',
    name: 'Or does nothing apply?',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 4,
    variants: PLAIN.length + EVERYDAY.length,
    minutes: 2.5,
    spontaneous: true,
  },
  (rng, seed) => {
    // Offset so the two templates walk the SAME pool from different starting
    // points, rather than one carrying every "nothing applies" answer.
    const c = cycle(seed + EVERYDAY.length, POOL)
    return {
      title: 'Unprompted',
      prompt: `${c.scene}\n\nWhat is the most useful thing to do here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Read the situation on its own terms before reaching for anything you have practised.',
        'Ask of each option: what would this actually change about what I do next?',
        'A method that fires everywhere has stopped telling you anything.',
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\n**What was being probed:** ${c.names}.\n\nThese are here so the unprompted questions cannot be beaten by assuming there is always a technique. Knowing which situations are ordinary is not a lesser skill than knowing the methods — a learner who applies a method to everything has traded one bad default for another. **These do not count toward your progress on any skill.**`,
    }
  },
)

const easyProbe = tpl(
  {
    id: 'sp-everyday-easy',
    name: 'No topic given',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 2,
    variants: EASY_POOL.length,
    minutes: 2,
    spontaneous: true,
  },
  (rng, seed) => probeBody(rng, cycle(seed, EASY_POOL)),
)

const mediumProbe = tpl(
  {
    id: 'sp-everyday-mid',
    name: 'Work out what it is asking',
    skillIds: ['x-method'],
    bucket: 'meta',
    difficulty: 3,
    variants: MID_POOL.length,
    minutes: 2.5,
    spontaneous: true,
    calibration: true,
  },
  (rng, seed) => probeBody(rng, cycle(seed + 2, MID_POOL)),
)

export const SPONTANEITY_TEMPLATES: ItemTemplate[] = [everydayProbe, plainProbe, easyProbe, mediumProbe]
