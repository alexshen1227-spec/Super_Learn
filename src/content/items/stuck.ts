/**
 * Working while stuck — being stuck as a state you can READ, not a verdict.
 *
 * Beast Academy names productive struggle as a thing you get better at rather
 * than a mood to endure (RESEARCH.md §37c). This is that, built for this app.
 *
 * What the evidence does and does not say (§37k):
 *
 *  - **Solid**: attempting a problem BEFORE being taught the method beats the
 *    reverse order. Sinha & Kapur (2021), 53 studies / 166 comparisons,
 *    Hedge's g = 0.36, rising to 0.37-0.58 at high fidelity. This app already
 *    runs that structure — PFL probes, the Notice-then-Predict diagrams, the
 *    Challenge Creator prediction. Nothing new is claimed there.
 *  - **Solid enough to teach**: help-seeking is a metacognitive skill with two
 *    failure modes, avoidance and over-reliance, and novices have both.
 *  - **NOT claimed**: that struggling as such makes you learn more, that
 *    difficulty is inherently good, or anything mindset-shaped. The content
 *    below never says "struggle is good for you". It says these are two
 *    different states, here is how to tell them apart, and here is what each
 *    one asks you to do.
 *
 * Two families, because Meta Lab needs two distinct ones to graduate a skill:
 * READING the state, and CHOOSING the next move.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'

// ------------------------------------------------------- reading the state

/**
 * The discrimination the whole skill rests on. Both states feel unpleasant and
 * only one of them is a signal to change what you are doing, so the feeling
 * cannot be the cue — the cue has to be whether the last few minutes produced
 * any new information.
 */
const readTheState = tpl(
  {
    id: 'stuck-read-state',
    name: 'Struggling, or stuck?',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 2,
    variants: 6,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        scene:
          'Ten minutes into a hard geometry problem. You have tried three different constructions. None solved it, but the last one showed you the two triangles are similar, which you did not know before.',
        correct: 'Productive struggle — keep going',
        wrong: [
          'Genuinely stuck — ask for a hint now',
          'Genuinely stuck — the ten minutes is the signal',
          'Impossible to tell without knowing the answer',
        ],
        why: 'Each attempt ruled something out and the last one produced a new fact. That is progress that happens to feel bad. Time spent is not the cue — information gained is.',
      },
      {
        scene:
          'Six minutes on an equation. You have rewritten the same line four times, each time in a slightly different order, and you know no more than when you started.',
        correct: 'Genuinely stuck — ask for the smallest next step',
        wrong: [
          'Productive struggle — rewriting is thinking',
          'Productive struggle — six minutes is not long',
          'Give up on this one and move to the next question',
        ],
        why: 'Four attempts, no new information. Repeating a move with cosmetic changes is the clearest signal there is: you are out of ideas rather than working through them. That is when a hint is worth the most.',
      },
      {
        scene:
          'A physics question you have not started writing anything for. You have read it twice and you are not sure what it is asking.',
        correct: 'Neither yet — you have not begun, so the first move is to make the question concrete',
        wrong: [
          'Genuinely stuck — ask for a hint',
          'Productive struggle — rereading is working on it',
          'Genuinely stuck — a question you cannot parse is too hard',
        ],
        why: 'Nothing has been attempted, so there is nothing to read the state from. List what you are given and what is asked, in your own words. Not-understanding-the-question is its own problem and a hint about the METHOD will not touch it.',
      },
      {
        scene:
          'A word problem. Your first approach broke on a detail, so you switched approaches, and the second one broke on the same detail.',
        correct: 'Genuinely stuck — and you already know exactly what to ask about',
        wrong: [
          'Productive struggle — two approaches means two ideas',
          'Genuinely stuck — but the whole problem needs explaining',
          'Productive struggle — try a third approach first',
        ],
        why: 'Two different routes failing at the same point identifies the blocker precisely. That is the most valuable question you will ever ask, and it is much better than "I do not get it" — you can name the exact detail.',
      },
      {
        scene:
          'A proof. You have been going twenty minutes, have filled a page, and can now state precisely which step you cannot justify.',
        correct: 'Productive struggle — and it has produced a specific question',
        wrong: [
          'Genuinely stuck — twenty minutes is too long for one problem',
          'Genuinely stuck — an unjustified step means the proof failed',
          'Neither — a page of work with no answer is wasted time',
        ],
        why: 'Narrowing "I cannot do this" down to "I cannot justify this one step" is most of the work. The page is not wasted; it is what produced the question. Asking about that single step now is efficient, not defeat.',
      },
      {
        scene:
          'A routine exercise like twenty you have done before. You cannot start, and you could yesterday.',
        correct: 'Neither — this is a memory gap, so go back to the method rather than the problem',
        wrong: [
          'Productive struggle — push through it',
          'Genuinely stuck — ask for a hint on this problem',
          'Genuinely stuck — you have lost the skill',
        ],
        why: 'Struggling on something NEW and blanking on something you owned are different problems with different cures. A hint on this problem patches today; re-reading the method fixes the twenty like it. Notice which one you are in.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Struggling, or stuck?',
      prompt: `${c.scene}\n\nWhich state is this, and what does it ask for?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ignore how long it has taken and how it feels. Ask only: did the last few attempts produce any NEW information?',
        'New information — even "that route is closed" — means keep going. The same move repeated means stop and ask.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThe cue is information, not time and not comfort. Both states feel unpleasant, which is exactly why the feeling cannot be the signal.`,
      transferBridge:
        'Same read outside study: in a stuck argument, a stuck bug, or a stuck plan, ask whether the last three attempts told you anything new. If not, the next move is a better question, not more of the same.',
      commonErrors: {
        strategy:
          'Using elapsed time as the cue. Ten minutes of narrowing is progress; two minutes of repeating is not.',
      },
    }
  },
)

// --------------------------------------------------------- choosing the move

/**
 * Help-seeking as a skill with two failure modes. Asking for the answer and
 * refusing to ask at all are both ways of not learning, and the middle move —
 * the smallest next thing, plus a statement of what is blocking — is the one
 * nobody teaches.
 */
const chooseTheMove = tpl(
  {
    id: 'stuck-next-move',
    name: 'What to ask for when you are stuck',
    skillIds: ['x-stuck'],
    bucket: 'meta',
    difficulty: 3,
    variants: 5,
    minutes: 2.5,
  },
  (rng, seed) => {
    const cases = [
      {
        scene:
          'You are stuck on a multi-step problem and a friend who has finished is sitting next to you.',
        correct: 'Ask them what the FIRST step is, and try the rest yourself',
        wrong: [
          'Ask to see their working so you can check yours against it',
          'Ask them to talk you through the whole solution',
          'Say nothing and keep going alone until the time runs out',
        ],
        why: 'The smallest unblocking amount leaves the rest of the problem still yours to do. A full walkthrough feels efficient and removes exactly the part that would have taught you something; saying nothing protects your pride at the cost of the hour.',
      },
      {
        scene: 'You are stuck and the app is offering you a hint ladder.',
        correct: 'Take one hint, then close it and try again before taking another',
        wrong: [
          'Take all the hints at once so you have the full picture',
          'Refuse the hints — a hinted answer does not count',
          'Take hints until the answer appears, then move on',
        ],
        why: 'One hint at a time keeps the maximum amount of the problem yours. Refusing entirely is its own trap: a hinted success is recorded honestly as guided rather than independent, so nothing is being faked — and an hour spent stuck teaches less than a hint and a real attempt.',
      },
      {
        scene: 'A teacher asks "what is the problem?" and you are genuinely stuck.',
        correct: '"I can get to this line, and I cannot see how to get past it because of this"',
        wrong: [
          '"I do not get it"',
          '"Can you show me how to do this type of question?"',
          '"I think I am just bad at this topic"',
        ],
        why: 'A precise blocker gets a precise answer in thirty seconds. "I do not get it" makes them re-teach from the start, most of which you did not need. Naming where you stopped is most of the diagnostic work, and doing it is often when you unstick yourself.',
      },
      {
        scene:
          'You have been stuck for fifteen minutes with no new information and there is nobody to ask.',
        correct: 'Write down exactly what is blocking you, then move on and come back to it',
        wrong: [
          'Keep going until you crack it — stopping is giving up',
          'Skip it and do not come back; it is clearly too hard',
          'Look up the answer and read it carefully',
        ],
        why: 'The written blocker is what makes coming back cheap — otherwise you restart from nothing. Grinding past the point of new information is the least productive time in a session, and reading an answer you have not earned tends to produce recognition rather than the ability to do it.',
      },
      {
        scene:
          'You got the answer only after three hints. The app records it as guided rather than independent.',
        correct: 'Correct and useful — it means the same idea will come back later to check it is yours',
        wrong: [
          'Unfair — you did solve it in the end',
          'Meaningless — hints make the whole attempt worthless',
          'A reason to avoid hints so your record looks better',
        ],
        why: 'The label is doing you a favour: it is what schedules the idea to return unaided. Avoiding hints to protect a record is optimising the scoreboard instead of the learning, and this app has no scoreboard to protect.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'What to ask for',
      prompt: `${c.scene}\n\nWhat is the best move?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'There are two ways to get this wrong: taking too much help, and taking none.',
        'Aim for the SMALLEST thing that unblocks you, and keep the rest of the problem yours.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nHelp-seeking is a skill with two failure modes rather than one. Most advice only warns about over-reliance, which quietly teaches the other failure — sitting stuck and calling it effort.`,
      transferBridge:
        'The good question — "here is where I got to, here is what is blocking me" — works on teachers, teammates, forums and search engines alike, and often answers itself while you write it.',
    }
  },
)

export const STUCK_TEMPLATES: ItemTemplate[] = [readTheState, chooseTheMove]
