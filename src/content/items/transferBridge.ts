/**
 * Structure bridges — the recognition half of real-world use.
 *
 * WHY THIS SHAPE, SPECIFICALLY. Gick & Holyoak found that trying to abstract a
 * principle from a SINGLE worked example largely failed: summarising it,
 * stating the principle outright, and diagramming it all produced little
 * spontaneous transfer. What worked was giving TWO analogous cases from
 * different surfaces and having the learner compare them — the schema emerges
 * as a by-product of the comparison, and that is what later transfers.
 *
 * That finding is inconvenient here, because "teach one case, then state the
 * principle" is close to the intervention that did NOT work. So these items do
 * the thing that did: two scenarios, deliberately far apart on the surface,
 * one shared structure, and the question is what the structure IS.
 *
 * Distractors are built to be SURFACE matches ("both involve money", "both
 * happen at school"), because noticing surface and missing structure is the
 * exact failure this trains against.
 *
 * The second family goes the other way: given the structure, which unfamiliar
 * situation is the same underneath? That is the transfer test rather than the
 * abstraction step, which is why those templates carry `transfer: true`.
 *
 * See docs/RESEARCH.md §20.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'

interface Bridge {
  a: string
  b: string
  structure: string
  surface: string[]
  why: string
  /** A third situation with the same structure, for the recognition family. */
  novel: string
  novelWrong: string[]
  novelWhy: string
}

function bridgePair(
  id: string,
  name: string,
  skillIds: string[],
  bucket: 'observer' | 'investigator' | 'strategist' | 'insight',
  cases: Bridge[],
): ItemTemplate[] {
  const compare = tpl(
    { id: `${id}-compare`, name: `${name}: shared structure`, skillIds, bucket, difficulty: 4, variants: cases.length, minutes: 3, calibration: true },
    (rng, seed) => {
      const c = cycle(seed, cases)
      return {
        title: 'What do these two share underneath?',
        prompt: `**Situation 1.** ${c.a}\n\n**Situation 2.** ${c.b}\n\nThese look nothing alike on the surface. What is the same underneath?`,
        answer: mcq(rng, c.structure, c.surface),
        hints: [
          'Ignore the setting, the people and the objects. Ask what ROLE each part plays.',
          'Try describing situation 1 without any of its nouns, then check whether that description also fits situation 2.',
          `Worked path: **${c.structure}**.`,
        ],
        explanation: `**${c.structure}**\n\n${c.why}\n\nThe reason this question is shaped as a comparison rather than an explanation: stating a principle after one example turns out to be a weak way to make it stick, while comparing two cases that share it works considerably better. The comparison is the exercise.`,
        commonErrors: {
          concept: 'Matching on surface features — the topic, the setting, the kind of people involved — instead of on the roles things play.',
        },
      }
    },
  )

  /*
   * CUED APPLICATION, NOT TRANSFER — and deliberately no longer flagged as such.
   *
   * This item names the principle in its own prompt ("The pattern: X") and asks
   * the learner to find an instance. Detterman's standard is that transfer has
   * to be SPONTANEOUS: an experiment where subjects are told which principle
   * applies is not measuring transfer, it is measuring application. This
   * template carried `transfer: true`, so it could grant the top rung of the
   * ladder for exactly the thing the critique says does not count — and the
   * explanation text underneath it claimed "nothing in real life arrives tagged
   * with which idea applies" while the prompt did the tagging.
   *
   * The item is kept, because cued application is genuinely useful practice and
   * is the step between comparing two cases and recognising one cold. It simply
   * no longer pretends to be evidence of transfer. `contentAudit.test.ts`
   * enforces this for every template, not just this one.
   */
  const spot = tpl(
    { id: `${id}-spot`, name: `${name}: same thing elsewhere`, skillIds, bucket, difficulty: 4, variants: cases.length, minutes: 2.5 },
    (rng, seed) => {
      const c = cycle(seed, cases)
      return {
        title: 'Where else is this?',
        prompt: `The pattern: **${c.structure}**\n\nWhich of these is the same thing wearing different clothes?`,
        answer: mcq(rng, c.novel, c.novelWrong),
        hints: [
          'Strip each option down to its roles before comparing.',
          'A wrong option usually shares a topic with the pattern while having a different shape.',
          `Worked path: **${c.novel}**.`,
        ],
        explanation: `**${c.novel}**\n\n${c.novelWhy}\n\nWorth being straight about what this exercise is: you were told which pattern to look for, so finding it is application, not transfer. The hard version is meeting one of these with no label attached — which is what the rest of the app is trying to set you up for.`,
        transferBridge:
          'When you meet this outside the app, the cue will be a feeling of familiarity with no label attached. That feeling is worth trusting enough to check.',
      }
    },
  )

  return [compare, spot]
}

// ---------------------------------------------------------------- observer

const OBSERVER_BRIDGES: Bridge[] = [
  {
    a: 'A friend says "the coach obviously hates me — he took me off after ten minutes."',
    b: 'A review says "this cafe does not care about customers; my coffee took fifteen minutes."',
    structure: 'A fact was observed, and a motive was invented to explain it and then reported as though it were also observed',
    surface: [
      'Both of them are complaints made by somebody who was disappointed by the outcome',
      'Both of them involve waiting a good deal longer than expected for something',
      'Both of them are about people in a position of authority who are behaving badly towards other people',
    ],
    why: 'The observations are "taken off after ten minutes" and "coffee took fifteen minutes". Everything about hating and not caring is inference — possible, unchecked, and stated in the same breath as the fact. The tell is that the motive is never marked as a guess.',
    novel: 'A note reading "you clearly did not read my message" when the writer only knows the message went unanswered',
    novelWrong: [
      'A note reading "your message arrived some time after I had already left the building"',
      'A note reading "I did not really understand what you meant by that last part"',
      'A note reading "I disagree with the decision that you made here, and here is exactly why I do"',
    ],
    novelWhy: 'Unanswered is the observation; "did not read it" is the invented mental state. The other three report the writer\'s own position or knowledge, which needs no guess about anyone else\'s mind.',
  },
  {
    a: 'You are sure the shop was on the left, but walking back you find it on the right.',
    b: 'You remember a friend agreeing to the plan, and they remember only saying they would think about it.',
    structure: 'A memory has been confidently reconstructed rather than replayed, and the confidence says nothing about its accuracy',
    surface: [
      'Both of them are cases of somebody being dishonest about what actually happened',
      'Both of them involve forgetting something that happened a very long time ago now',
      'Both of them would have been solved by somebody simply paying more attention in the moment at the time',
    ],
    why: 'Memory rebuilds rather than replays, and the rebuild feels identical from the inside whether or not it is right. That is why confidence cannot be used as evidence of accuracy — the two are separate things this app measures separately on purpose.',
    novel: 'Two witnesses to the same argument giving accounts that differ on who spoke first, both certain',
    novelWrong: [
      'Two witnesses giving accounts that differ because one of them was in a different room',
      'Two people disagreeing about whether the argument was a serious one or not',
      'A person refusing to say anything about what they saw during the argument',
    ],
    novelWhy: 'Both were present, both rebuilt, both feel certain — that is the same structure. The second option is a difference in access, not in reconstruction; the third is a difference of judgment; the fourth is not a memory question at all.',
  },
  {
    a: 'A birdwatcher who has learned twenty calls hears a wood far busier than you do.',
    b: 'A mechanic hears a specific bearing failing where you hear an engine.',
    structure: 'The same raw input yields far more information to someone carrying the right prior knowledge',
    surface: [
      'Both of them are people who have practised the same hobby for a great many years now',
      'Both are examples of some people simply having naturally sharper hearing',
      'Both of them involve sounds that are quite difficult to hear clearly',
    ],
    why: 'Nothing about the ears differs. What differs is a stock of learned categories, which turns undifferentiated noise into named things. "Sharper senses" is the tempting reading and the wrong one — the difference is knowledge, and knowledge can be acquired.',
    novel: 'A reader who knows the period spots that a document is a forgery from its vocabulary',
    novelWrong: [
      'A reader who checks the document against a whole database of known forgeries',
      'A reader who suspects the document because the story it tells seems unlikely',
      'A reader who asks an outside expert whether the document is genuine',
    ],
    novelWhy: 'The vocabulary case is the same shape: stored knowledge converts an ordinary observation into a detection. Checking a database is a tool, doubting the story is a plausibility judgment, and asking an expert is borrowing someone else\'s stored knowledge rather than using your own.',
  },
]

// ---------------------------------------------------------------- investigator

const INVESTIGATOR_BRIDGES: Bridge[] = [
  {
    a: 'A test for a rare condition is 99% accurate, and it comes back positive — but most positives are still false.',
    b: 'A security system flags 1 in 100 bags, and almost every bag it flags turns out to be harmless.',
    structure: 'A rare thing plus an accurate detector still gives mostly false alarms — the base rate outweighs the accuracy',
    surface: [
      'Both of them are examples of technology being unreliable in actual practice',
      'Both of them involve percentages that a lot of people find difficult to calculate correctly at all',
      'Both of them describe systems that get used in medical or security settings',
    ],
    why: 'Count the worlds: out of 10,000 people with a 1-in-1,000 condition, 10 have it and about 10 do not but test positive anyway — so a positive is a coin flip, despite "99% accurate". The accuracy figure is real; it is just not the number that answers the question you asked.',
    novel: 'A spam filter that is right 98% of the time flagging a message, when almost no incoming mail is spam',
    novelWrong: [
      'A spam filter that misses obvious spam because its rules are out of date',
      'A weather forecast that is right 98% of the time about tomorrow\'s rain',
      'A survey with a 2% margin of error reporting a close result',
    ],
    novelWhy: 'Rare event plus accurate detector equals unreliable positives — same structure. The out-of-date filter is a plain failure; the forecast is a frequent event, not a rare one; the survey is sampling error, a different problem entirely.',
  },
  {
    a: 'You keep buying tickets for a show you no longer want to see, because you already paid for the first three.',
    b: 'A company keeps funding a project going nowhere, because of what has already been spent.',
    structure: 'A cost that cannot be recovered is being used to justify a future choice, when only future costs can bear on it',
    surface: [
      'Both of them are situations in which somebody has gone and wasted quite a large amount of money on it',
      'Both of them involve decisions about entertainment or about business spending',
      'Both of them are cases of somebody being unwilling to admit to a mistake',
    ],
    why: 'The spent money is gone under every option, so it cannot favour any of them. The correct question is always the same: from here, forwards only, what is the best use of the next hour or the next pound? Admitting a mistake often follows, but the structure is about which costs are still live.',
    novel: 'Finishing a book you are not enjoying because you are already 200 pages in',
    novelWrong: [
      'Finishing a book you are not enjoying because it is set for an exam',
      'Choosing not to start a long book because you rarely finish them',
      'Buying a book because a friend recommended it strongly',
    ],
    novelWhy: 'The 200 pages are spent and irrecoverable, so they cannot justify the next 200 — same shape. The exam gives a genuine forward-looking reason; the third is a prediction about the future; the fourth is about a decision to start, where nothing is sunk yet.',
  },
  {
    a: 'Everyone who won the tournament used the same warm-up, so the warm-up is credited — but nobody looked at the players who used it and lost.',
    b: 'Every successful founder profiled in a book dropped out, so dropping out is credited — but the dropouts who failed were never profiled.',
    structure: 'A conclusion is drawn from survivors only, because the failures were removed from view before anyone counted',
    surface: [
      'Both of them are stories about competitive fields in which success is rare',
      'Both of them involve people who are looking for some kind of shortcut to becoming really successful',
      'Both of them are cases where the sample size that was used was far too small',
    ],
    why: 'The evidence has been filtered before it reaches you, so the comparison group is invisible rather than absent. The fix is always the same question: who had this feature and did NOT succeed, and would I have heard about them?',
    novel: 'Reading only the reviews of people who finished a course, and concluding the course is excellent',
    novelWrong: [
      'Reading only the negative reviews of a course and concluding it is bad',
      'Reading reviews of a course written several years ago',
      'Reading reviews of a course written by people paid to write them',
    ],
    novelWhy: 'People who dropped out do not write finisher reviews, so they are filtered out before you look — that is survivorship. Choosing to read only negatives is your own selection, old reviews are a staleness problem, and paid reviews are a bias in the writing rather than in who got to write.',
  },
]

// ---------------------------------------------------------------- strategist

const STRATEGIST_BRIDGES: Bridge[] = [
  {
    a: 'A group project is due Friday. Nobody can start the write-up until the data is collected, and nobody can collect data until the question is agreed.',
    b: 'A meal needs the oven for the potatoes and for the pie, and the pie has to cool before it can be served.',
    structure: 'One chain of dependent steps sets the earliest possible finish, and work off that chain has slack',
    surface: [
      'Both are the kind of task that involves several different people working together on it',
      'Both are situations in which somebody has left the important things until far too late',
      'Both of them require making a detailed list of every single thing that has to be done first',
    ],
    why: 'Some steps must wait for others; those form the chain that fixes the deadline. Everything else can move around it. Finding that chain tells you where extra effort actually buys time — speeding up an off-chain task buys nothing at all.',
    novel: 'Revising for two exams where one subject needs a textbook currently on loan to a friend',
    novelWrong: [
      'Revising for two different exams that both fall on the very same morning',
      'Revising for an exam in a subject that you find a great deal harder than the other one',
      'Revising for exams while also holding down a part-time job at the weekends',
    ],
    novelWhy: 'The borrowed textbook creates a dependency with a wait built in, which is what makes it a chain. Two exams on one morning is a deadline, an unequal difficulty is an effort question, and the job is a constraint on total hours — none of them impose an ORDER.',
  },
  {
    a: 'Before launching the school newsletter, the team imagines it is six months later and the project has failed, then lists why.',
    b: 'Before a long hike, you imagine turning back halfway and ask what would have caused it.',
    structure: 'Failure is assumed to have already happened, so reasons can be named that optimism would otherwise hide',
    surface: [
      'Both are examples of the habit of planning things out carefully before beginning anything at all',
      'Both of them involve people being deliberately pessimistic about how their own chances look to them',
      'Both are activities that need writing down as a list before they become useful to anybody at all',
    ],
    why: 'Asking "what might go wrong?" invites a shrug; asserting that it DID go wrong forces you to explain it, and explanations are much easier to generate than predictions. The pessimism is a device for retrieval, not a mood.',
    novel: 'Assuming a saved file has already been lost, and asking what the backup gap must have been',
    novelWrong: [
      'Deciding never to rely on one single saved file, on the grounds that computers fail',
      'Making three separate copies of the file in three different places to be safe',
      'Checking whether the file still opens correctly some time after you saved it',
    ],
    novelWhy: 'Only the first assumes the failure and reasons backwards to its cause. The others are sensible precautions, but they are answers rather than the technique that generates them.',
  },
  {
    a: 'A plan wins the argument by making the other side look foolish, and they stop cooperating for the rest of the year.',
    b: 'A negotiation extracts everything from a supplier, who quietly stops prioritising your orders.',
    structure: 'A first-round win imposes a cost in later rounds, because the loser is still there and still has choices',
    surface: [
      'Both are examples of one person behaving unkindly towards the other people who are involved in it',
      'Both of them involve an argument about money, or about some other resource that is in short supply',
      'Both are situations that could have been avoided altogether if somebody had been willing to compromise',
    ],
    why: 'The game is repeated, and treating it as one-shot is the error. Note this is not simply "be nice": it is that a strategy which ignores later rounds is measurably worse at getting what you want, which is why the ethical version is usually the effective one too.',
    novel: 'Winning every disagreement in a study group until people stop sharing their notes',
    novelWrong: [
      'Winning a debate competition against a team that you will never have to meet again',
      'Refusing to join a study group at all, because you would rather work on your own',
      'Disagreeing with a teacher about a mark you were given and being told no',
    ],
    novelWhy: 'The study group repeats and the others retain the ability to withhold, so the win has a later price. The debate is genuinely one-shot, working alone is a preference, and the teacher case has no later round you control.',
  },
]

// ---------------------------------------------------------------- insight / guardian

const INSIGHT_BRIDGES: Bridge[] = [
  {
    a: '"This offer expires in ten minutes — decide now or lose it."',
    b: '"Everyone else already agreed, so are you in or not?"',
    structure: 'The time or space to think is being removed, which is a move against your judgment rather than an argument for the proposal',
    surface: [
      'Both of them are the sort of thing that a dishonest salesperson would say to you',
      'Both of them are attempts to sell somebody something that the buyer does not actually need',
      'Both of them involve one person speaking rudely and aggressively to another person who has done nothing wrong',
    ],
    why: 'Neither says anything about whether the thing is good. Both attack the conditions under which you decide — one by deadline, one by isolation. The defence is identical and does not require deciding who is honest: slow it down. "I will tell you tomorrow" costs nothing when an offer is genuine.',
    novel: 'A message saying "do not tell anyone about this yet, I want to keep it between us"',
    novelWrong: [
      'A message saying "please do not repeat this, they told me in confidence"',
      'A message saying "I would rather discuss this in person than over text"',
      'A message saying "take your time and let me know when you have thought about it"',
    ],
    novelWhy: 'Being cut off from other people is the same structure as being cut off from time — it removes the check rather than making a case. The second protects someone else\'s confidence, the third is a preference about the medium, and the fourth does the opposite by handing time back.',
  },
  {
    a: '"I am sorry you feel that way."',
    b: '"Mistakes were made."',
    structure: 'The form of an apology is present while the ownership has been removed, leaving nothing that could change behaviour',
    surface: [
      'Both of them are things that get said by somebody who is not actually sorry at all',
      'Both of them are phrases that sound rather old-fashioned and overly formal to most people who hear them',
      'Both of them are used mainly by public figures who are trying to avoid a scandal',
    ],
    why: 'A real apology names the act, owns it, and changes something. The first relocates the problem into your feelings; the second deletes the actor with grammar. The useful test is not sincerity, which you cannot see — it is whether anything named will now be different.',
    novel: '"I am sorry if anyone was offended by what I said."',
    novelWrong: [
      '"I am sorry I said that — it was unfair and I will not do it again."',
      '"I am sorry, I did not realise that would land the way it did. What would help?"',
      '"I am not going to apologise for that, because I think I was right."',
    ],
    novelWhy: '"If anyone was offended" makes the harm hypothetical and the audience unnamed, which is the same removal of ownership. The next two own the act; the last is an honest refusal, which is at least clear about where it stands.',
  },
  {
    a: 'A friend asks to copy your homework, and the discomfort you feel is the point at which you have to say something.',
    b: 'Someone keeps borrowing money and not returning it, and each new request feels harder to refuse than the last.',
    structure: 'A boundary gets more expensive to state the longer it goes unstated, because each silence is read as consent',
    surface: [
      'Both of them are problems that are caused by having friends who behave badly towards other people',
      'Both of them are situations that involve either school or money',
      'Both of them would be solved simply by ending the friendship',
    ],
    why: 'The cost of the first "no" is much lower than the fifth, because by then a pattern has been established that a refusal now has to break. This is why the early, small, unembarrassing sentence is the whole skill — not confrontation, but timing.',
    novel: 'Not mentioning that a group member has skipped three meetings, and then having to raise it in front of everyone at the end',
    novelWrong: [
      'Not mentioning a disagreement about the project topic during the first meeting',
      'Telling a group member privately after the first missed meeting that you noticed',
      'Asking the teacher to reassign you to a different group',
    ],
    novelWhy: 'Three silences make the fourth conversation into an accusation instead of a note — that is the escalating cost. The second option is exactly the early, cheap version; the third escalates around the person rather than to them; the first is a difference of opinion, not a boundary.',
  },
]

export const TRANSFER_BRIDGE_TEMPLATES: ItemTemplate[] = [
  ...bridgePair('bridge-o', 'Observer', ['o-obsinf'], 'observer', OBSERVER_BRIDGES),
  ...bridgePair('bridge-i', 'Investigator', ['i-hypo'], 'investigator', INVESTIGATOR_BRIDGES),
  ...bridgePair('bridge-st', 'Strategist', ['st-decomp'], 'strategist', STRATEGIST_BRIDGES),
  ...bridgePair('bridge-h', 'Guardian', ['h-influence'], 'insight', INSIGHT_BRIDGES),
]
