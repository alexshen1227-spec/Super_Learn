/**
 * Other minds, honestly — three DEFENSIVE skills about the limits of reading
 * people, not about how to read them.
 *
 *   h-mindread  how reliable your read is, and which moves actually improve it
 *   h-nested    tracking a belief about a belief without losing the thread
 *   h-asking    the question that would settle it, phrased so it can be asked
 *
 * WHAT THIS DOES NOT CLAIM, STATED FIRST. The owner asked for "theory of mind /
 * mentalizing". docs/RESEARCH.md §42 is the long answer; the short one is that
 * this unit does not train it and does not claim to.
 *
 * - Hofmann et al. (2016), Cognition 150, 200-212: 32 papers, 45 procedures,
 *   1,529 children, aggregate Hedges' g = 0.75 [0.60, 0.89]. This is the number
 *   everyone quotes, and its sample has a MEAN AGE OF 63 MONTHS. It measures
 *   four-to-six-year-olds acquiring first-order false belief for the first
 *   time. This app's learner passed that milestone a decade ago, and there is
 *   no adolescent equivalent to quote instead.
 * - Fletcher-Watson et al. (2014), Cochrane CD008785, 22 studies, 695
 *   participants: ToM skills CAN be taught, and there is poor quality evidence
 *   that they are maintained, that they generalise to other settings, or that
 *   teaching them affects developmentally-linked abilities.
 * - The Reading the Mind in the Eyes Test is not used here and no item is built
 *   in its shape. It is contested as a mentalizing measure at all — it tracks
 *   emotion recognition and emotion vocabulary, and correlates moderately with
 *   verbal IQ. An item asking a learner to read a face would be scoring
 *   vocabulary and calling it insight.
 *
 * WHAT IS ACTUALLY BEING TAUGHT, and the study it rests on.
 *
 * Eyal, Steffel & Epley (2018), JPSP 114(4), 547-571, "Perspective mistaking".
 * Twenty-five experiments: fifteen standard interpersonal-accuracy tests, nine
 * naturalistic ones using real couples and friends, and a final experiment
 * contrasting the two strategies. Being instructed to take another person's
 * perspective did NOT reliably improve accuracy, if anything decreased it, and
 * increased confidence. Experiment 25 tested asking the person directly, and
 * that improved accuracy.
 *
 * So the taught rule is: imagining someone's point of view makes you surer
 * without making you righter, and the only move with evidence behind it is
 * getting the information rather than generating it. That is a named, abstract,
 * falsifiable rule of exactly the kind §41a identifies as the only thing with
 * real transfer support — and it is the opposite of a mind-reading technique.
 *
 * DIRECTION, AS CONTENT LAW. Everything here is defence and self-correction.
 * The learner's confident read is always the thing under examination; no item
 * teaches reading a person for advantage, extracting anything, detecting a lie,
 * or getting a result out of anybody. Confident mind-reading is what both
 * manipulation and ordinary conflict run on, so undermining it is protective.
 * Every question a learner is taught to ask is one that can be asked out loud,
 * to the person's face, in a conversation both sides know they are having.
 *
 * TWO ITEMS BREAK THE FRAME ON PURPOSE. `h-mind-limits` and `h-ask-limits`
 * each include a case where the honest answer is that this is not a reading
 * problem at all and an adult should be involved. Those keys are not
 * exercises in perspective — they exist so the unit cannot be read as "work
 * out what is going on by yourself, always".
 *
 * ON THE NESTED-BELIEF ITEMS. `h-nested` is second-order belief reasoning — A
 * believes that B believes X. It is included as LOGIC, and labelled that way to
 * the learner: it is nested conditional reasoning in a social costume, the same
 * form the Investigator path teaches with switches and rules. It carries no
 * claim about understanding real people, because per Fletcher-Watson there is
 * no evidence it would.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, multi, tpl } from '../lib'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

// ============================================================ h-mindread
// How good is your read?

interface ReadCase {
  scene: string
  /** The move that actually raises the odds of being right. */
  correct: string
  /** Moves that raise confidence, or do nothing. Matched in length to the key. */
  wrong: string[]
  why: string
}

const READ_MOVES: ReadCase[] = [
  {
    scene:
      'Sam has gone quiet in the group chat since Thursday. You have a strong feeling you know why — something you said about their drawing — and it has been sitting with you all weekend.',
    correct: 'Ask Sam directly whether something you said landed badly, and say which thing you mean',
    wrong: [
      'Replay the conversation carefully from Sam’s side until the reason becomes clear to you',
      'Picture yourself as Sam receiving that comment, and notice how it would have felt',
      'Think back to how Sam reacted the last few times someone criticised their drawing',
      'Work out which of the possible reasons is most likely, then act as though that one is true',
    ],
    why: 'Three of those are ways of generating a better guess, and the fourth is picking a favourite among guesses. Only one of them puts new information in front of you.',
  },
  {
    scene:
      'Your teammate said "fine, do it your way" about the project layout. You are fairly sure they are annoyed rather than agreeing, and you have about a day before the work has to be split up.',
    correct: 'Say what you noticed and ask whether they actually disagree, before anything gets divided',
    wrong: [
      'Imagine the sentence coming out of your own mouth and decide what you would have meant',
      'Look at how they have reacted to being overruled on the last two group projects',
      'Give them a day to cool off and see whether the annoyance is still there by tomorrow morning',
      'Choose the reading that keeps the project moving and get on with the work either way',
    ],
    why: 'Waiting and watching is not a terrible option, but it costs a day and still ends in a guess. The question takes a minute and ends in an answer.',
  },
  {
    scene:
      'A friend keeps turning down invitations. You have built a fairly detailed explanation of what is going on with them, and the more you think about it the more certain it feels.',
    correct: 'Notice that the certainty grew while you were thinking, not while you were learning anything',
    wrong: [
      'Trust it — a picture that keeps fitting more of the evidence is usually the right one',
      'Test the picture against everything else you already know about how your friend usually behaves',
      'Consider how you would explain the same run of refusals if you were in their position',
      'Accept the explanation for now and adjust it if something contradicts it later',
    ],
    why: 'A story that gets more convincing the longer you sit with it is showing you something about the sitting, not about your friend. No new evidence arrived between Thursday and Sunday.',
  },
  {
    scene:
      'Two people you know have fallen out and each has told you their version. Both accounts are detailed and each one sounds obviously right while you are hearing it.',
    correct: 'Treat "it sounds obviously right while I hear it" as a fact about the telling, not the truth',
    wrong: [
      'Go with the account from the person you have known longer and trust more',
      'Put yourself in each of their positions in turn and see which of the two stories holds up better',
      'Average the two accounts, since the truth is usually somewhere in the middle',
      'Work out which of them had more to gain from the fallout going the way it did',
    ],
    why: 'A well-told account is persuasive because it is well told. That is true of both of them, which is why noticing the effect matters more than picking a winner.',
  },
  {
    scene:
      'You are certain a classmate is upset with you. You have decided the kindest thing is to work out what you did and fix it quietly, without making them talk about it.',
    correct: 'Consider that fixing the wrong thing quietly can look like ignoring the real one',
    wrong: [
      'Go ahead — sorting it without a conversation spares them having to bring it up',
      'Imagine which of your recent actions would have bothered you most in their place',
      'Ask a mutual friend whether they know what has been going on with the classmate',
      'Change the two things most likely to be the cause and watch whether things improve',
    ],
    why: 'The quiet fix is generous in intention and rests entirely on the guess being right. If it is wrong, the visible result is that you changed something unrelated and never mentioned it.',
  },
  {
    scene:
      'Someone you have never met has been described to you in detail by three different people, and the descriptions broadly agree. You feel you already know roughly what they are like.',
    correct: 'Remember that three people from the same group may be one source repeated three times',
    wrong: [
      'Take the agreement seriously — several independent accounts converging is real evidence',
      'Imagine the person those descriptions add up to, and expect roughly that person',
      'Assume the shared parts are accurate and treat the parts that differ as noise',
      'Wait to meet them, but keep the composite picture as a reasonable starting point',
    ],
    why: 'Agreement is only evidence when the accounts are independent. Three friends who discuss someone regularly are closer to one account than to three.',
  },
]

const mindEntry = tpl(
  {
    id: 'h-mind-entry',
    name: 'Which move actually helps?',
    skillIds: ['h-mindread'],
    bucket: 'insight',
    difficulty: 2,
    variants: READ_MOVES.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, READ_MOVES)
    return {
      title: 'A confident read',
      prompt: `${c.scene}\n\nWhich move would actually raise your chance of being **right** — as opposed to raising how sure you feel?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Sort the options into two piles: ones that bring in information you do not currently have, and ones that rearrange information you already have.',
        'Thinking harder about a question you cannot see the answer to produces a better-organised guess. It is still a guess.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThis is the finding the whole skill rests on. Across 25 experiments — including ones using real couples and close friends — people told to take someone else's perspective did not get more accurate, sometimes got less accurate, and consistently got **more confident**. The one thing that worked was getting the information instead of generating it. Imagining is not a weaker version of asking; it moves a different dial.`,
    }
  },
)

// --- sorting moves by which dial they move ---------------------------------

interface MoveSet {
  scene: string
  /** category 0 = raises accuracy, 1 = raises only confidence. Three of each. */
  statements: { text: string; category: number }[]
  note: string
}

const MOVE_SORT: MoveSet[] = [
  {
    scene: 'You want to know whether your friend actually minded you cancelling on Saturday.',
    statements: [
      { text: 'Ask them whether Saturday was annoying, and mean the question', category: 0 },
      { text: 'Spend the evening imagining how you would have felt in their place', category: 1 },
      { text: 'Notice they have cancelled on you twice without it being a problem', category: 0 },
      { text: 'Go back over their last message looking for the tone underneath it', category: 1 },
      { text: 'Remember they told you last month that late notice is the part they hate', category: 0 },
      { text: 'Build the most likely explanation and check that it fits everything', category: 1 },
    ],
    note: 'The three on the accuracy side either ask, or recall something the person actually said or did. The three on the other side all take the evidence you already have and work it harder — which is exactly the operation that produced confidence without accuracy in the study.',
  },
  {
    scene: 'A teacher seemed short with you at the end of the lesson and you are trying to work out why.',
    statements: [
      { text: 'Ask at the start of the next lesson whether you had missed something', category: 0 },
      { text: 'Find out from the timetable whether they had taught five lessons straight', category: 0 },
      { text: 'Imagine being a teacher at the end of a long day and how that feels', category: 1 },
      { text: 'Decide which of your recent pieces of work most likely caused it', category: 1 },
      { text: 'Check whether they were short with everyone or only with you', category: 0 },
      { text: 'Replay their exact words several times until the meaning settles', category: 1 },
    ],
    note: 'Checking whether it happened to everyone is the cheapest accuracy move in the whole set and almost nobody makes it. Replaying the words is the most tempting and moves nothing — the words have not changed since the first replay.',
  },
  {
    scene: 'Someone in your class has been much quieter than usual for about a fortnight.',
    statements: [
      { text: 'Ask them, plainly and without a theory attached, how things are going', category: 0 },
      { text: 'Notice whether the change lines up with anything you actually know about', category: 0 },
      { text: 'Construct the explanation that accounts for the most days of quiet', category: 1 },
      { text: 'Consider how someone in that situation would probably be feeling', category: 1 },
      { text: 'Ask whether they would rather be left alone, and then respect the answer', category: 0 },
      { text: 'Work out which of your classmates is the likeliest cause of the change', category: 1 },
    ],
    note: 'Asking whether someone wants to be left alone belongs on the accuracy side: it is a real question with a real answer, and the answer settles what to do next. Working out who caused it is the same guessing operation dressed as concern.',
  },
]

const mindSort = tpl(
  {
    id: 'h-mind-sort',
    name: 'Two dials, not one',
    skillIds: ['h-mindread'],
    bucket: 'insight',
    difficulty: 3,
    variants: MOVE_SORT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, MOVE_SORT)
    return {
      title: 'Accuracy or just confidence?',
      prompt: `${c.scene}\n\nSort each move by which dial it actually moves.`,
      answer: classify(rng, ['Makes you more right', 'Only makes you more sure'], c.statements),
      hints: [
        'Ask of each one: after doing this, do I know something I did not know before?',
        'Rearranging the evidence you already have cannot add evidence, however carefully you do it.',
        'Anything that ends in "and then I decided which was most likely" belongs on the confidence side.',
      ],
      explanation: `${c.note}\n\nThe reason to keep these apart is that they feel identical from the inside. Confidence is the only signal you get about how good your read is, and the moves that raise it most are frequently the ones that add nothing.`,
    }
  },
)

// --- the observation / inference split, applied to a person ----------------

interface SplitCase {
  scene: string
  /** category 0 = observed, 1 = added by you. Three of each. */
  statements: { text: string; category: number }[]
  note: string
}

const READ_SPLIT: SplitCase[] = [
  {
    scene:
      'At lunch, Ellie put her phone face down when you sat down, answered two questions with one word each, and left before the bell.',
    statements: [
      { text: 'The phone went face down as you sat down', category: 0 },
      { text: 'She did not want you to see what was on the screen', category: 1 },
      { text: 'Two of her answers were a single word long', category: 0 },
      { text: 'She was annoyed with you specifically', category: 1 },
      { text: 'She left the table before the bell went', category: 0 },
      { text: 'She was avoiding a conversation she knew was coming', category: 1 },
    ],
    note: 'Everything in the first column would appear on a recording. Everything in the second is something you supplied — and each one may be true. The point is not that the inferences are wrong; it is that they arrived without evidence and will be remembered as though they were seen.',
  },
  {
    scene:
      'Your brother came in, dropped his bag by the door instead of taking it upstairs, opened the fridge twice without taking anything, and put headphones on.',
    statements: [
      { text: 'The bag was left by the door rather than taken up', category: 0 },
      { text: 'Something went wrong at school today', category: 1 },
      { text: 'He opened the fridge twice and took nothing out', category: 0 },
      { text: 'He does not want to be asked about it', category: 1 },
      { text: 'The headphones went on shortly after he came in', category: 0 },
      { text: 'He is in a bad mood rather than just tired', category: 1 },
    ],
    note: 'Tired and upset produce almost identical evidence, which is why the second column cannot be settled from the first. Notice how quickly "he does not want to be asked" would justify never asking — an inference that protects itself from being tested.',
  },
  {
    scene:
      'In the group call, Ben unmuted twice and said nothing both times, agreed with the plan at the end, and left the call first.',
    statements: [
      { text: 'He unmuted on two occasions without speaking', category: 0 },
      { text: 'He had an objection and decided not to raise it', category: 1 },
      { text: 'He said he agreed with the plan before the call ended', category: 0 },
      { text: 'His agreement was not genuine', category: 1 },
      { text: 'He was the first person to leave the call', category: 0 },
      { text: 'He has given up on the group', category: 1 },
    ],
    note: 'The unmuting is the interesting observation and it supports several stories, including a bad connection and a sibling walking in. Treating it as a swallowed objection is a reasonable hypothesis and a poor conclusion.',
  },
]

const mindSplit = tpl(
  {
    id: 'h-mind-split',
    name: 'Seen, or supplied?',
    skillIds: ['h-mindread'],
    bucket: 'insight',
    difficulty: 2,
    variants: READ_SPLIT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, READ_SPLIT)
    return {
      title: 'What did you actually see?',
      prompt: `${c.scene}\n\nSplit the list: which of these did you **observe**, and which did you **add**?`,
      answer: classify(rng, ['You observed it', 'You supplied it'], c.statements),
      hints: [
        'A camera in the corner would have caught the observations. It would not have caught anything about what someone wanted or felt.',
        'Every claim about a reason, a motive or a state of mind is supplied — even the obvious ones.',
        'The test is not whether it is true. It is whether the scene contains it.',
      ],
      explanation: `${c.note}\n\nThis is the same observation-versus-inference split the Observer path teaches about physical scenes, pointed at a person instead. It is harder here, because inferences about people arrive faster and feel more like perceptions than inferences about objects do.`,
    }
  },
)

// --- where reading stops being the right tool ------------------------------

interface LimitCase {
  scene: string
  correct: string
  wrong: string[]
  why: string
  /** True when the case deliberately leaves the exercise frame. */
  breaksFrame?: boolean
}

const READ_LIMITS: LimitCase[] = [
  {
    scene:
      'You cannot work out why a friend has been off with you, and asking has not helped: they said "nothing’s wrong" twice and the atmosphere did not change.',
    correct: 'Accept that you have a read you cannot confirm, and hold it loosely instead of acting',
    wrong: [
      'Keep asking in different ways until you get an answer that explains the atmosphere',
      'Work out the answer yourself, since they have already had two chances to tell you',
      'Assume the answer is the most likely one and quietly change your behaviour to match',
      'Decide it is not about you at all and simply carry on exactly as you were before',
    ],
    why: 'Asking is the move with evidence behind it, and it can still come back empty. When it does, the honest position is an unresolved read — not a resolved one you reached alone. "Keep asking until they tell you" is the point where a reasonable move turns into pressure.',
  },
  {
    scene:
      'A classmate has said something that made you think they might be in real trouble at home. You are turning over what they meant and whether you are reading too much into it.',
    correct: 'Stop analysing and tell an adult you trust what was actually said',
    wrong: [
      'Work out how likely it is before involving anyone, so you do not overreact',
      'Ask more questions yourself until you understand the situation properly',
      'Keep it to yourself for now, since they told you and not anybody else',
      'Watch for a while and see whether anything else points the same way',
    ],
    why: 'This one is not a reading problem and it is deliberately in this set so the skill has an edge. Everything else here says slow down and doubt your read. This says the opposite: when what you have heard points at someone being unsafe, the accuracy of your interpretation is not yours to establish, and getting it to an adult is the move. In the UK you can call Childline on 0800 1111; in the US, 988.',
    breaksFrame: true,
  },
  {
    scene:
      'You are convinced someone dislikes you. You have never spoken to them properly, and the evidence is a handful of expressions and a seating choice.',
    correct: 'Notice how little evidence this is, and how complete the conclusion feels anyway',
    wrong: [
      'Test it by being noticeably friendly and watching carefully how they respond',
      'Ask someone who knows them whether they have said anything about you',
      'Take the hint and keep out of their way until something changes',
      'Consider what you might have done to give them that impression of you',
    ],
    why: 'The gap between the evidence and the confidence is the whole finding. Asking a third party is worse than it looks: it turns a private guess into a shared one and gives it a life outside your head.',
  },
]

const mindLimits = tpl(
  {
    id: 'h-mind-limits',
    name: 'When reading is the wrong tool',
    skillIds: ['h-mindread'],
    bucket: 'insight',
    difficulty: 3,
    variants: READ_LIMITS.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, READ_LIMITS)
    return {
      title: 'The edge of the skill',
      prompt: `${c.scene}\n\nWhat is the honest move here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what happens if your read is wrong. If the cost of being wrong is carried by someone else, that changes the answer.',
        'Some situations are not puzzles to be solved by the person noticing them.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}`,
    }
  },
)

// ============================================================ h-nested
// What they think you think — second-order belief, presented as logic

interface NestCase {
  /** The sequence of events, written so every belief update is visible. */
  setup: string
  question: string
  correct: string
  wrong: string[]
  why: string
}

const NEST_CASES: NestCase[] = [
  {
    setup:
      'Ravi puts his calculator in the blue drawer and goes to lunch.\nWhile he is gone, Mia moves it to the green drawer.\nRavi comes back through the door as she closes it, and sees where it now is. Mia does not notice him in the doorway.',
    question: 'Mia is asked where Ravi will look for his calculator. What does she say?',
    correct: 'The blue drawer — she has no idea that he saw her move it',
    wrong: [
      'The green drawer — that is where the calculator actually is now',
      'The green drawer — she knows he came back into the room at some point',
      'The blue drawer — she thinks he has forgotten where he originally left it',
      'Either drawer — she has no way of forming a view on this',
    ],
    why: 'The question is not where the calculator is, and not where Ravi will look. It is what MIA believes about what Ravi believes. Her information stopped when she failed to see him in the doorway, so her model of him is still the one from before.',
  },
  {
    setup:
      'Tom tells Ana that practice is cancelled. He believes this, because the group chat said so.\nTen minutes later the chat is corrected: practice is on after all.\nAna reads the correction. Tom has his phone on silent and has not looked at it.',
    question: 'Ana is asked whether Tom will turn up to practice. What should she say?',
    correct: 'No — he still believes it is cancelled, because he has not seen the correction',
    wrong: [
      'Yes — the correction went to the whole group and he is in that group',
      'Yes — he will check his phone again before the time practice would start',
      'No — he had already decided not to go to practice this week anyway',
      'It cannot be worked out from what Ana knows about the situation',
    ],
    why: 'Ana has two separate facts to hold apart: what is true (practice is on) and what Tom has been exposed to (only the first message). Reasoning from the truth instead of from his exposure is the standard error, and it survives well past the age where the classic version of this puzzle gets easy.',
  },
  {
    setup:
      'Leo hides the spare key under the mat and tells only Priya.\nPriya, thinking she is being helpful, moves it to the plant pot and tells nobody.\nLeo sees the mat is empty when he gets home, but does not find the key.',
    question: 'Leo is asked who he thinks knows where the key is now. What is his honest answer?',
    correct: 'Priya might — she is the only person he told, and the key has moved',
    wrong: [
      'Nobody does — he is the one who hid it and he cannot find it himself',
      'Priya does — she moved it, so she certainly knows where it is now',
      'Anyone who uses the door — an empty mat is obvious to whoever looks',
      'He cannot form any view, because he does not know that it was moved',
    ],
    why: 'Leo can reason past his own ignorance. He does not know where the key is, but he knows who had the information needed to move it. Note the near-miss: "Priya does" states it too strongly, because Leo cannot know she was the one who moved it rather than someone who happened to spot it.',
  },
  {
    setup:
      'Two teams are told the room booking has changed. Team A is told in person. Team B is sent an email.\nThe email bounces. Nobody is told that it bounced.\nTeam A is asked to set up the new room and assumes Team B will be there.',
    question: 'Where does the mistake in Team A’s reasoning actually sit?',
    correct: 'They treated a message being sent as a message being received',
    wrong: [
      'They should have checked with Team B before agreeing to set up the room',
      'They assumed Team B cared about the booking as much as they did',
      'They relied on email when something more immediate was available',
      'They did not consider that Team B might have had a reason not to come',
    ],
    why: 'This is the same structure as the calculator and the group chat, one level up and without a villain: a belief was updated for one party and not the other, and nobody had the information that the update failed. The other options are all reasonable criticisms and none of them names the actual gap.',
  },
  {
    setup:
      'Nadia thinks Sam is upset with her.\nSam is not upset, but has noticed Nadia being distant and now thinks Nadia is upset with HIM.\nNeither has said anything.',
    question: 'Which description of the situation is accurate?',
    correct: 'Each is reacting to the other’s reaction, and neither original belief was true',
    wrong: [
      'Nadia was wrong at the start and Sam is now correctly reading her distance',
      'Both are upset with each other, so both of the beliefs have become true',
      'Sam is wrong, but Nadia was right that something had gone wrong between them',
      'Neither can be described as wrong, because both are responding to real behaviour',
    ],
    why: 'The distance Sam observes is real, which is what makes his inference feel evidenced. It is real because of Nadia’s false belief, so the evidence is downstream of the mistake. This is the mechanism behind a large share of ordinary fallings-out, and the only exit is the one this unit keeps pointing at: somebody asks.',
  },
]

const nestTrack = tpl(
  {
    id: 'h-nest-track',
    name: 'A belief about a belief',
    skillIds: ['h-nested'],
    bucket: 'insight',
    difficulty: 3,
    variants: NEST_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, NEST_CASES)
    return {
      title: 'Track the belief, not the fact',
      prompt: `${c.setup}\n\n${c.question}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Write down what each person has been EXPOSED to, in order. Beliefs follow exposure, not truth.',
        'The question asks about someone’s belief about someone else’s belief. Answering with the actual fact is the trap.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nWorth being clear about what this exercise is: it is nested conditional reasoning — the same form as "if the rule holds then the switch is down" — with people instead of switches. Getting good at it makes you better at **this kind of puzzle**. There is no evidence that it makes anyone better at understanding real people, and this app will not tell you otherwise.`,
    }
  },
)

// --- who knows what, as a set --------------------------------------------

interface KnowsCase {
  setup: string
  question: string
  correct: string[]
  incorrect: string[]
  note: string
}

const KNOWS_CASES: KnowsCase[] = [
  {
    setup:
      'The maths test has been moved to Friday. Mr Hall announced it in the lesson on Tuesday.\nJo was absent on Tuesday. Kai was there but had headphones in and missed it.\nJo checked the class noticeboard on Wednesday, where the change is posted. Kai has not looked at the noticeboard all week.',
    question: 'Which of these are true at the end of Wednesday?',
    correct: [
      'Jo knows the test is on Friday',
      'Kai believes the test is on its original day',
      'Mr Hall would expect both of them to know',
    ],
    incorrect: [
      'Kai knows the test has been moved to Friday',
      'Jo believes the test is on its original day',
      'Nobody in the class could have learned about the change',
    ],
    note: 'Kai is the interesting one: he was physically present for the announcement and still does not have the information. Presence and exposure are not the same thing, and the person doing the announcing cannot tell them apart from the front of the room.',
  },
  {
    setup:
      'Ella lends Dan a book and asks him to pass it to Sara when he is done.\nDan finishes it and leaves it in Sara’s locker without saying anything.\nSara has not opened her locker since. Ella asks Dan on Thursday whether Sara has it.',
    question: 'Which of these are true when Ella asks?',
    correct: [
      'Dan believes Sara has the book',
      'Sara does not know the book is waiting for her',
      'The book is where Dan says it is',
    ],
    incorrect: [
      'Sara believes Dan still has the book to give her',
      'Dan knows for certain that Sara has received it',
      'Ella has enough information to know where the book is',
    ],
    note: 'The trap is the option about Sara believing Dan still has it. Nothing in the setup says Sara is thinking about the book at all — a belief has to be attributed on evidence, and "she has not been told" is not the same as "she believes the opposite".',
  },
  {
    setup:
      'The bus route changed on Monday. The company posted it online three weeks ago.\nRosa reads the company’s posts. Theo does not, but Rosa mentioned it to him last week in passing.\nTheo was on his phone at the time and said "mm".',
    question: 'Which of these can be said with confidence?',
    correct: [
      'Rosa knows the route has changed',
      'Rosa believes she has told Theo',
      'It is not established whether Theo took it in',
    ],
    incorrect: [
      'Theo knows the route has changed',
      'Theo does not know the route has changed',
      'Rosa knows whether Theo took it in',
    ],
    note: 'Both of the confident options about Theo are wrong, and that is the lesson: "mm" is not evidence either way. Most of the errors in this whole unit come from converting an absence of evidence into a belief about someone, in whichever direction feels more natural.',
  },
]

const nestKnows = tpl(
  {
    id: 'h-nest-knows',
    name: 'Who knows what',
    skillIds: ['h-nested'],
    bucket: 'insight',
    difficulty: 4,
    variants: KNOWS_CASES.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, KNOWS_CASES)
    return {
      title: 'Sort out who has what',
      prompt: `${c.setup}\n\n${c.question} Select every true statement.`,
      answer: multi(rng, c.correct, c.incorrect),
      hints: [
        'Take one person at a time and list only what reached them. Ignore what is true.',
        'Being in the room is not the same as receiving the information.',
        'Watch for statements that give someone a belief they have no reason to hold either way.',
      ],
      explanation: `${c.note}`,
    }
  },
)

// ============================================================ h-asking
// The question that would settle it

interface AskCase {
  scene: string
  /** The question that would actually resolve the uncertainty. */
  correct: string
  wrong: string[]
  why: string
}

const ASK_CASES: AskCase[] = [
  {
    scene:
      'You think your friend is annoyed that you brought someone else along on Saturday, but you are not sure whether it is that or something else entirely.',
    correct: '"Was Saturday alright? I wasn’t sure about bringing Alex without checking."',
    wrong: [
      '"You’ve been off with me since Saturday — is this about me bringing Alex along?"',
      '"Is everything okay? You seem like something has been bothering you recently."',
      '"You’re not annoyed about Saturday, are you? Because Alex really wanted to come."',
      '"Sorry if Saturday was weird. I know I should have asked you about it first."',
    ],
    why: 'The key names the specific thing and leaves the answer genuinely open. The first decoy states your read as a fact and asks them to confirm it, which mostly gets you agreement. The second is too vague to be answered. The third supplies the answer you want inside the question. The fourth is an apology, not a question, and closes the topic instead of opening it.',
  },
  {
    scene:
      'A teammate said "fine, whatever" about your plan for splitting the work, and you cannot tell whether that was agreement or not.',
    correct: '"I couldn’t tell if that was a yes — would you rather we split it differently?"',
    wrong: [
      '"You said fine, so are we agreed on doing it the way I suggested then?"',
      '"Is there a problem with the plan? You didn’t seem very enthusiastic about it."',
      '"I know it’s not what you wanted, but can we just go with it for this one?"',
      '"Do you actually think this plan is going to work or are you humouring me?"',
    ],
    why: 'Naming your own uncertainty — "I couldn’t tell" — makes it easy to say no, which is the only way a yes means anything. The decoys either seek confirmation, ask about a problem the other person now has to assert, pre-concede the argument, or arrive with an edge that makes honesty expensive.',
  },
  {
    scene:
      'You are fairly sure a classmate has been leaving you out of a group, but it is also possible the arrangements were made before you were around.',
    correct: '"How does the group usually get organised? I keep finding out afterwards."',
    wrong: [
      '"Why does nobody tell me when the group is meeting up these days?"',
      '"Am I being left out on purpose, or is there something I’m missing here?"',
      '"I don’t mind not being invited, I just think it would be nice to know."',
      '"Has someone said something about me that I should probably know about?"',
    ],
    why: 'The key asks about the mechanism rather than about intent, and it can be answered honestly whichever the truth is. Every decoy makes the other person respond to an accusation — even the mild one, which says it does not mind while making clear that it does.',
  },
  {
    scene:
      'Your parent has seemed short with you for two days and you do not know whether it is about you, about work, or about nothing.',
    correct: '"Is this just a bad couple of days, or have I actually done something?"',
    wrong: [
      '"Have I done something wrong? You’ve been snapping at me since Tuesday."',
      '"What’s wrong? You’ve been in a mood with me for two days straight now."',
      '"I’ll stay out of your way if you’d rather not have me around at the moment."',
      '"Are you angry with me about the thing on Tuesday, or is it something else?"',
    ],
    why: 'The key offers a way out that is not about you and does not require anyone to admit to a mood. Offering to stay out of the way looks considerate and actually forecloses the conversation — it hands over a read as a decision.',
  },
  {
    scene:
      'You suspect a friend told someone else something you said in confidence, but the only evidence is that the other person knew.',
    correct: '"Did what I told you last week come up with anyone? I’d rather know than guess."',
    wrong: [
      '"Did you tell Priya what I said last week? Because she seems to know about it."',
      '"I thought that was between us — was I wrong about that, or did it get out?"',
      '"Somebody has clearly said something, so I just want to know whether it was you."',
      '"Do you remember what I told you last week? Only I think it might have spread."',
    ],
    why: '"I’d rather know than guess" says out loud what this whole skill is about, and it leaves room for the answer to be "yes, by accident". The decoys all arrive having already decided, and the last one is the sly version — it pretends to be a memory question while making the accusation anyway.',
  },
  {
    scene:
      'You want to know whether someone would actually welcome your help with something, or whether offering would be intrusive.',
    correct: '"Do you want a hand with that, or would you rather get on with it?"',
    wrong: [
      '"Let me know if you need any help with that — I’m around all afternoon."',
      '"That looks like a lot. Do you want me to take some of it off you?"',
      '"I could help you with that if you like. It wouldn’t take me very long."',
      '"Are you sure you don’t need help? It seems like quite a lot to do alone."',
    ],
    why: 'Only the key makes declining an equally easy answer by naming it. "Let me know if you need help" sounds open and puts the whole burden of asking on the other person, which is why it so often produces nothing.',
  },
]

const askQuestion = tpl(
  {
    id: 'h-ask-question',
    name: 'The question that settles it',
    skillIds: ['h-asking'],
    bucket: 'insight',
    difficulty: 3,
    variants: ASK_CASES.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_CASES)
    return {
      title: 'Ask it properly',
      prompt: `${c.scene}\n\nAsking beats guessing — but only if the question can actually be answered honestly. Which one can?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Try answering each one with the reply you least want to hear. If that reply is awkward to give, the question is not really open.',
        'A question that contains your conclusion collects agreement, not information.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThis is the practical half of the skill. Getting the information is the move with evidence behind it, and a question that has already decided the answer is not getting information — it is running the guess past someone and calling the result a confirmation.`,
    }
  },
)

// --- the ungraded write-then-check pair -----------------------------------

interface AskDraftCase {
  scene: string
  criteria: string[]
  model: string
  probe: string
  key: string
  decoys: string[]
  why: string
}

const ASK_DRAFTS: AskDraftCase[] = [
  {
    scene:
      'Your friend has not replied to two messages in four days. Before that, nothing seemed wrong. You have caught yourself building an explanation and you would rather not act on it.',
    criteria: [
      'Say what you actually observed, with nothing added',
      'Say what you have concluded, and mark it as a conclusion',
      'Write the question you would ask, in words you would really use',
    ],
    model:
      'Observed: two messages, four days, no reply, and nothing unusual before that. Concluded: that they are annoyed with me about something — which nothing in the observations supports, since a four-day gap has a dozen ordinary causes. The question: "Everything alright? You went quiet and I didn’t know if I’d missed something." That names the observation, does not state the conclusion, and can be answered with "yes, just busy" without anyone having to manage my feelings about it.',
    probe: 'Which part of that draft is the part the evidence actually supports?',
    key: 'The observations — the gap and the silence, with nothing attached to them',
    decoys: [
      'The conclusion, since a four-day silence from a close friend is genuinely unusual',
      'The question, because asking is the move with the evidence behind it',
      'All of it equally, since observation and conclusion were both written down honestly',
      'None of it, because a person’s behaviour cannot be evidence for anything by itself',
    ],
    why: 'Writing the conclusion down and labelling it is the useful move, and labelling it does not promote it. The question is a good ACTION, not a supported CLAIM — those are different things, and the split is what keeps the read honest until an answer arrives.',
  },
  {
    scene:
      'Someone in your class made a comment you took as a dig. You are about eighty per cent sure it was meant that way, and you have to sit next to them tomorrow.',
    criteria: [
      'Say what was said, as close to word-for-word as you can manage',
      'Say what else it could have meant, including readings you do not believe',
      'Write the question you would ask, in words you would really use',
    ],
    model:
      'Said: the exact words, with who else was there and what had just been said before it. Other readings: a joke aimed at the situation rather than me; a repeat of something said earlier that I missed the start of; a dig, which is what I think. The question: "That thing you said about the presentation — was that aimed at me? I genuinely couldn’t tell." That reports my uncertainty accurately, which is the part I am sure about.',
    probe: 'What does writing out the alternative readings actually achieve here?',
    key: 'It shows how many stories fit the same words, which is what the eighty per cent hid',
    decoys: [
      'It makes you more likely to give the person the benefit of the doubt next time',
      'It replaces a hostile reading with a kinder one, which is usually the fairer choice',
      'It proves the dig reading was wrong, since other explanations were available',
      'It calms you down enough to go and have the conversation without getting angry',
    ],
    why: 'The alternatives are not there to be believed, and not there to make you nicer. They are a check on the confidence: if four readings fit, the eighty per cent was doing work the evidence did not support. Note that the dig reading may still be correct — this does not settle it, which is exactly why the question follows.',
  },
]

const askDraft = tpl(
  {
    id: 'h-ask-draft',
    name: 'Write it out, then check it',
    kind: 'multi',
    skillIds: ['h-asking', 'h-mindread'],
    bucket: 'insight',
    difficulty: 3,
    variants: ASK_DRAFTS.length,
    minutes: 5,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_DRAFTS)
    return {
      title: 'Separate it out',
      prompt: 'Get the read out of your head and onto the page, where its parts can be told apart.',
      explanation:
        'Splitting what you saw from what you concluded is the whole exercise. Both are allowed; running them together is what turns a guess into something you will later remember having known.',
      hints: [
        'Write the observations with no adjectives about anyone’s state of mind.',
        'The conclusion goes in, clearly marked. Hiding it does not remove it.',
        'The question has to be one you would say out loud, in your own words.',
      ],
      parts: [
        part('Write', {
          prompt: `${c.scene}\n\nWrite three things: what you observed, what you have concluded, and the question you would ask.`,
          answer: draft({
            criteria: c.criteria,
            model: c.model,
            minWords: 30,
            placeholder: 'What I actually saw…',
          }),
          explanation:
            'Never scored — the app cannot read writing and marking it would be pretending. The writing is what does the work here; the graded part below checks whether the split held.',
        }),
        part('Check', {
          prompt: c.probe,
          answer: mcq(rng, c.key, c.decoys),
          explanation: c.why,
        }),
      ],
    }
  },
)

// --- when asking is not available -----------------------------------------

const ASK_LIMITS: LimitCase[] = [
  {
    scene:
      'The person you would need to ask is someone you do not know well enough to ask, and the thing you are unsure about is whether they meant to exclude you from something.',
    correct: 'Leave it unresolved and act on what you would do if you did not know either way',
    wrong: [
      'Ask a mutual friend to find out what the person actually meant by it',
      'Assume the innocent reading, since you have no evidence for the other one',
      'Assume the unkind reading, since protecting yourself costs less than being wrong',
      'Behave slightly more distantly until you have worked out what is going on',
    ],
    why: '"Act as if you do not know" is the honest move when you genuinely do not, and it is different from picking a reading. Assuming the innocent version is more pleasant and still a guess. Going through a third party turns your uncertainty into someone else’s conversation.',
  },
  {
    scene:
      'You could ask, but the question would embarrass the other person in front of people, and there will be no chance to ask them alone before the thing is decided.',
    correct: 'Decide without the answer, and say plainly that you are deciding without it',
    wrong: [
      'Ask anyway — getting the information matters more than a moment of awkwardness',
      'Guess their answer as carefully as you can and proceed as though they gave it',
      'Delay the decision until a private conversation becomes possible to have',
      'Ask someone else who is likely to know what their answer would have been',
    ],
    why: 'Naming the gap out loud is the part that matters: it lets the decision be revisited and it does not credit you with information you do not have. Guessing carefully and proceeding "as though they gave it" is the specific failure this whole unit is about — it launders an inference into a fact.',
  },
  {
    scene:
      'Someone has told you something about a third person, and you find yourself building a fairly firm picture of a person you have never met.',
    correct: 'Treat the picture as a description of one person’s account, not of the person',
    wrong: [
      'Keep the picture but stay ready to revise it once you have met them yourself',
      'Discount it entirely, since second-hand accounts of people are worth nothing',
      'Ask other people who know them whether the description sounds about right',
      'Form a view only about the specific incidents described, not about the person',
    ],
    why: 'The last decoy is nearly right and is the interesting one: restricting yourself to the incidents still accepts them as reported. The key keeps the source attached to the claim, which is the only version that survives finding out the account was one-sided.',
  },
]

const askLimits = tpl(
  {
    id: 'h-ask-limits',
    name: 'When you cannot ask',
    skillIds: ['h-asking'],
    bucket: 'insight',
    difficulty: 4,
    variants: ASK_LIMITS.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_LIMITS)
    return {
      title: 'No question available',
      prompt: `${c.scene}\n\nAsking is off the table. What now?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        '"I do not know" is an available position, and acting on it is different from picking a reading.',
        'Watch for options that route your uncertainty through a third person.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}`,
    }
  },
)

// --- transfer: the principle on unfamiliar ground -------------------------

interface TransferCase {
  scene: string
  correct: string
  wrong: string[]
  why: string
}

const TRANSFER_CASES: TransferCase[] = [
  {
    scene:
      'A shop’s reviews are mostly five stars. You spend a while imagining what kind of customer writes a review at all, and conclude the rating is inflated. You feel much surer than you did before you started thinking.',
    correct: 'The reasoning may be right, but the extra certainty came from thinking, not from evidence',
    wrong: [
      'The reasoning is sound, so the extra certainty it produced is properly earned',
      'The conclusion is wrong, because inventing a typical reviewer proves nothing at all',
      'The reasoning is fine but incomplete without knowing how many reviews there are',
      'The conclusion should be trusted, since it corrects for a bias rather than adding one',
    ],
    why: 'Selection effects in reviews are real, so the conclusion is probably right. The point is the second half: no new information arrived while you were reasoning, so the confidence that arrived with it is unbacked. This is the same split as reading a person, on material that has nothing to do with people.',
  },
  {
    scene:
      'You are debugging code you did not write. You build a detailed picture of what the original author was trying to do, and it explains every strange decision in the file.',
    correct: 'A picture that explains everything is a warning sign, not a confirmation',
    wrong: [
      'The picture is likely accurate, since it accounts for all of the observed behaviour',
      'The picture is useless, because the author’s intentions do not affect what the code does',
      'The picture is worth keeping but should be checked against the version history first',
      'The picture is fine as long as you do not change anything based on it alone',
    ],
    why: 'An explanation that accommodates every detail has usually been fitted to them. Note that checking the version history is a genuinely good idea — it is the perspective-GETTING move here — but it is not what is wrong with the reasoning, and the question asks about the reasoning.',
  },
  {
    scene:
      'A referee gives a decision against your team. Within seconds you have a complete account of why: what they saw, what they assumed, and which earlier incident coloured it.',
    correct: 'The speed of the account is evidence about you, not about the referee',
    wrong: [
      'The account is probably right, since you watched the whole incident closely',
      'The account is worthless, because nobody can know what a referee was thinking',
      'The account is fine but should be checked against a replay before being repeated',
      'The account is reasonable given that referees do carry decisions between incidents',
    ],
    why: 'Nothing was available in those seconds that could have supported that much detail. The generating process is the finding: given almost any behaviour, people produce a complete and confident account of the mind behind it, at a speed that rules out having weighed anything.',
  },
]

const mindTransfer = tpl(
  {
    id: 'h-mind-transfer',
    name: 'The same trap, off the subject',
    skillIds: ['h-mindread'],
    bucket: 'insight',
    difficulty: 4,
    variants: TRANSFER_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, TRANSFER_CASES)
    return {
      title: 'Not about people at all',
      prompt: `${c.scene}\n\nWhat is worth noticing here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'The question is about where the confidence came from, not about whether the conclusion is true.',
        'Ask what new information arrived between starting to think and finishing.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThese are deliberately not about reading a person. If the rule only fires when someone says "what do you think they meant?", it has been learned as a topic rather than as a rule — and the whole point of naming it was to have it available when nothing announces itself.`,
    }
  },
)

// --- easy entry points ----------------------------------------------------
//
// Both required by the content audit, and both are the right shape anyway: a
// skill whose cheapest task is 3★ is one a struggling learner never meets.

interface EntryCase {
  setup: string
  question: string
  correct: string
  wrong: string[]
  why: string
}

const NEST_ENTRY: EntryCase[] = [
  {
    setup: 'Amir leaves his water bottle on the bench and goes to bowl.\nSomeone tidies it into the kit bag while he is away.\nAmir did not see this happen.',
    question: 'Where will Amir look for his bottle when he comes back?',
    correct: 'On the bench, because that is where he left it before bowling',
    wrong: [
      'In the kit bag, because that is where the bottle actually is',
      'In the kit bag, because that is where bottles are usually kept',
      'Nowhere in particular — he will ask somebody where it went',
      'On the bench first and then the kit bag, since he knows it moves',
    ],
    why: 'People act on what they believe, and Amir\'s belief was fixed when he walked away. The pull toward the kit bag is the pull of what YOU know — the whole skill is keeping those two apart.',
  },
  {
    setup: 'Freya reads that the library shuts at five and tells Owen.\nThe closing time was changed to six that morning, but the old sign is still up.\nOwen has not seen either sign.',
    question: 'What does Owen believe about closing time?',
    correct: 'Five o’clock, because that is the time he was given',
    wrong: [
      'Six, because that is the actual closing time now',
      'Six, because the change was made before Freya spoke to him',
      'Neither — he has no information about closing time at all',
      'Five, but he suspects Freya may have got it wrong',
    ],
    why: 'Beliefs come from what reached the person, not from what is true. Freya passed on a wrong fact in good faith, so Owen holds it as firmly as if it were right.',
  },
  {
    setup: 'Jonah tells Beth the meeting is in room 4.\nBeth then sees a notice saying it has moved to room 7.\nJonah has not seen the notice.',
    question: 'Which room does Jonah expect Beth to go to?',
    correct: 'Room 4, because that is the last information he was given',
    wrong: [
      'Room 7, because that is where the meeting now is',
      'Room 7, because Beth would obviously check the notices',
      'Room 4, but he will realise his mistake on the way there',
      'He has no expectation, having handed the problem to Beth',
    ],
    why: 'This one asks about Jonah\'s belief about BETH — one level up. His picture of her has not been updated, because nothing has updated him.',
  },
  {
    setup: 'Ines hides a card under the blue cup and leaves the room.\nWhile she is gone, Ravi swaps it to the red cup, then swaps it back to the blue one.\nInes saw none of this.',
    question: 'Where does Ines think the card is?',
    correct: 'Under the blue cup, which also happens to be where the card is',
    wrong: [
      'Under the red cup, because that is where it was moved to',
      'She does not know, because the card was moved while she was out',
      'Under the blue cup, but only by luck rather than by reasoning',
      'Either cup — two swaps leave the position genuinely uncertain',
    ],
    why: 'A deliberate near-miss: her belief happens to be correct, and it got there without her knowing anything about the swaps. Being right and being informed are different, and this is the case that separates them.',
  },
]

const nestEntry = tpl(
  {
    id: 'h-nest-entry',
    name: 'What do they think is true?',
    skillIds: ['h-nested'],
    bucket: 'insight',
    difficulty: 2,
    variants: NEST_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, NEST_ENTRY)
    return {
      title: 'Belief, not fact',
      prompt: `${c.setup}\n\n${c.question}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Cover up everything the person did not see. Answer using only what is left.',
        'The question is about a belief. The true state of the world is not the answer unless they happened to see it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nThis is the entry level of a logic form, not a social skill: track one belief while knowing something the believer does not. The harder items in this skill stack them — what one person believes about what another believes.`,
    }
  },
)

const ASK_ENTRY: EntryCase[] = [
  {
    setup: 'You cannot tell whether your friend minded that you were late.',
    question: 'Which of these is a real question rather than a guess dressed as one?',
    correct: '"Did me turning up late actually mess anything up for you?"',
    wrong: [
      '"You weren\'t bothered about me being late, were you?"',
      '"I know you\'re annoyed about earlier — how bad is it?"',
      '"Is everything alright? You\'ve been a bit funny with me."',
      '"Sorry about earlier, I know that was really annoying for you."',
    ],
    why: 'A real question leaves both answers equally easy to give. Three of these have already picked an answer, and the fourth is an apology — useful, but it closes the subject rather than opening it.',
  },
  {
    setup: 'You want to know if a classmate would like to join your group for the project.',
    question: 'Which of these can be answered honestly without any awkwardness?',
    correct: '"We\'ve got room in our group — would you rather join us or stay where you are?"',
    wrong: [
      '"You should join our group, everyone else has already got one sorted."',
      '"Do you want to join our group? You looked a bit stuck on your own there."',
      '"Nobody\'s picked you yet, have they? You can come with us if you like."',
      '"Would you like to join our group, or would that be weird for you?"',
    ],
    why: 'Naming both options — join us, or stay — makes "no thanks" an ordinary answer rather than a rejection. The others each smuggle in a claim about the person\'s situation that they would have to correct before answering.',
  },
  {
    setup: 'A teacher gave you a mark you did not expect and you want to understand it.',
    question: 'Which question is most likely to get you a useful answer?',
    correct: '"Could you show me whereabouts I lost the marks on this one, so I can see?"',
    wrong: [
      '"Why did I get such a low mark? I thought this one went quite well."',
      '"Is there any chance this was marked a bit harshly compared to the rest?"',
      '"What did other people get for this? I want to know where I came out."',
      '"Did you mark this differently from the last one? It feels inconsistent."',
    ],
    why: 'Asking where the marks went is a question with a factual answer that the teacher can simply give. The rest ask them to defend the mark, which turns an explanation into an argument.',
  },
  {
    setup: 'You are not sure whether a message you sent came across badly.',
    question: 'Which of these actually gets you information?',
    correct: '"Did that message come out wrong? I honestly wasn\'t sure how it read."',
    wrong: [
      '"That message was fine, wasn\'t it? I was in a rush when I sent it."',
      '"Sorry about that message, I shouldn\'t have sent it like that."',
      '"You didn\'t take that message the wrong way, did you? It wasn\'t meant badly."',
      '"Ignore that last message, I\'m going to write it out again properly."',
    ],
    why: 'Admitting your own uncertainty — "I wasn\'t sure how it read" — is what makes an honest answer cheap to give. The others tell the person what to think about it first.',
  },
]

const askEntry = tpl(
  {
    id: 'h-ask-entry',
    name: 'Real question or dressed-up guess?',
    skillIds: ['h-asking'],
    bucket: 'insight',
    difficulty: 2,
    variants: ASK_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_ENTRY)
    return {
      title: 'Ask, do not confirm',
      prompt: `${c.setup}\n\n${c.question}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Imagine giving the answer the asker least wants. If that is hard to say, it is not really a question.',
        'A question containing your conclusion collects agreement, not information.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**\n\n${c.why}\n\nAsking is the one move with evidence behind it — but only when the question is genuinely open. A question that has already decided the answer just runs your guess past someone and returns it to you looking confirmed.`,
    }
  },
)

export const OTHER_MINDS_TEMPLATES: ItemTemplate[] = [
  nestEntry,
  askEntry,
  mindEntry,
  mindSort,
  mindSplit,
  mindLimits,
  mindTransfer,
  nestTrack,
  nestKnows,
  askQuestion,
  askDraft,
  askLimits,
]
