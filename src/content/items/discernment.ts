/**
 * Discernment: telling the ordinary from the off.
 *
 * ## The gap this closes
 *
 * Measured across the bank: of 55 Observer and Human Insight question
 * families, **exactly one** ever had "nothing is wrong here" as the correct
 * answer. Everywhere else the right answer was that something WAS an
 * inference, a pressure tactic, or a manipulation — so a learner who simply
 * answered "suspicious" every time would have scored close to full marks
 * without possessing the skill.
 *
 * The misinformation-assessment literature names this directly (RESEARCH.md
 * §29f): scoring only the REJECTION of bad content confounds genuine skill
 * with blanket scepticism, and the field standard is to mix true and false
 * items and score discernment across both. The physics bank already took the
 * same medicine from TIPERs, where "What, if Anything, is Wrong" tasks are
 * defined by admitting that sometimes nothing is.
 *
 * It also matters more here than anywhere else in the app. A teenager trained
 * to read every direct request as manipulation has not been protected; they
 * have been given a different problem. The Guardian path exists to make them
 * safer in real relationships, and a detector that fires on everything is
 * useless in exactly the way a detector that never fires is.
 *
 * ## Shape
 *
 * Both families run a deliberately balanced case list — roughly half the
 * scenarios are entirely ordinary — and the correct answer is computed from
 * which case was drawn, never authored per option. The benign cases are not
 * softballs: they are direct, disappointed, or urgent in ways that pattern-
 * match to the tactics, and are still fine.
 *
 * Safety boundary, unchanged: these teach RECOGNITION and self-protection,
 * never how to apply any of it. Nothing danger-adjacent appears; the harder
 * end of that material breaks the game frame and points to a trusted adult,
 * and is handled elsewhere.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'

/* ------------------------------------------------------- human insight */

interface AskCase {
  msg: string
  verdict: string
  why: string
  benign: boolean
}

/**
 * Half of these are ordinary. The tactics are drawn from documented pressure
 * patterns — manufactured time limits, isolation from advice, making refusal
 * cost the relationship — and the benign cases deliberately share their
 * surface: a real deadline, a real disappointment, a real request for a
 * decision today.
 */
const ASK_CASES: AskCase[] = [
  {
    msg: 'I know it is short notice, but the form really does close at five today. Here is the link — shout if you get stuck.',
    verdict: 'Nothing is wrong — the deadline is real and checkable, and help is offered',
    why: 'Urgency by itself is not a tactic. This one names a specific, verifiable time, gives you what you need to act, and does not care whether you consult anyone.',
    benign: true,
  },
  {
    msg: 'This is only available for the next ten minutes and I would not mention it to anyone else — they will only talk you out of it.',
    verdict: 'A manufactured deadline, plus being steered away from advice',
    why: 'Two tactics stacked. The clock exists to stop you thinking, and the second half exists to stop anyone else thinking either. A genuine offer survives you asking someone.',
    benign: false,
  },
  {
    msg: 'I would really rather you came on Saturday. I will be disappointed if you cannot, but I do understand.',
    verdict: 'Nothing is wrong — a clear wish, honestly stated, with room to decline',
    why: 'People are allowed to want things and to be disappointed. What makes it clean is that saying no is permitted and carries no threat.',
    benign: true,
  },
  {
    msg: 'After everything I have done for you, I would have thought this was the least you could do.',
    verdict: 'Turning past help into a debt you have to repay on demand',
    why: 'Real generosity does not come with an invoice. Converting it into leverage the moment they want something is the tell.',
    benign: false,
  },
  {
    msg: 'Everyone else already said yes. You are the only one holding this up.',
    verdict: 'Social pressure, plus casting you as the obstacle for hesitating',
    why: 'What other people chose is not an argument about what is right for you, and being named as the problem is there to make the hesitation itself feel rude.',
    benign: false,
  },
  {
    msg: 'Most people go with the second option, but have a proper look and pick whichever suits you.',
    verdict: 'Nothing is wrong — it reports what others do without pressing you to copy them',
    why: 'Telling you what is common is information. It only becomes pressure when your differing from it is made into a problem.',
    benign: true,
  },
  {
    msg: 'If you actually cared, you would not need to think about it.',
    verdict: 'Making the relationship the price of taking time to decide',
    why: 'Thinking is being redefined as evidence of not caring, which leaves you no way to be both careful and a good friend. That trade is the manipulation.',
    benign: false,
  },
  {
    msg: 'I need an answer today because I have to book it tonight — but a no is completely fine.',
    verdict: 'Nothing is wrong — a real constraint, and refusing is explicitly allowed',
    why: 'A deadline that comes from the situation rather than from you, with no penalty attached to declining. Compare the ten-minute version, which exists only to hurry you.',
    benign: true,
  },
]

const OPTIONS = [
  'Nothing is wrong — this is an ordinary, honest request',
  'A manufactured deadline, or pressure not to consult anyone',
  'Making refusal cost you the relationship',
  'Social pressure — using what others did to move you',
]

/** Map a case to the general option it belongs under, so options stay fixed. */
function optionFor(c: AskCase): string {
  if (c.benign) return OPTIONS[0]
  if (/deadline|talk you out|ten minutes/i.test(c.verdict)) return OPTIONS[1]
  if (/relationship|debt|cared/i.test(c.verdict)) return OPTIONS[2]
  return OPTIONS[3]
}

const askDiscernment = tpl(
  {
    id: 'ins-discernment',
    name: 'Pressure, or an ordinary ask?',
    skillIds: ['h-influence'],
    bucket: 'insight',
    difficulty: 3,
    variants: 8,
    minutes: 3,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ASK_CASES)
    const correct = optionFor(c)
    return {
      title: 'Reading the ask',
      prompt:
        `Someone says:\n\n> ${c.msg}\n\nWhat is going on here?\n\n` +
        `About half of these are perfectly ordinary. "Nothing is wrong" is a real answer and is sometimes the right one.`,
      answer: mcq(rng, correct, OPTIONS.filter((o) => o !== correct)),
      hints: [
        'Three questions, in order: is the time limit real, does saying no cost you anything beyond the thing itself, and are you being nudged away from other people?',
        'A request can be direct, urgent and even disappointed without being a tactic. What matters is whether refusing has been made expensive.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${c.verdict}.** ${c.why}\n\n` +
        (c.benign
          ? 'Getting the ordinary ones right is half the skill. A defence that fires on everything is not caution — it costs you people who were being straight with you, and it stops being informative the moment it never says "this is fine".'
          : 'Naming it is usually enough to slow it down. You do not have to accuse anyone: "I will let you know tomorrow" is a complete sentence, and a genuine request survives it.'),
    }
  },
)

/* ------------------------------------------------------------- observer */

interface ClaimCase {
  scene: string
  claim: string
  benign: boolean
  why: string
}

/**
 * The Observer version of the same problem. Every existing family asks the
 * learner to catch an unsupported inference, so "that goes beyond what you
 * saw" was always right. Here half the claims stay strictly inside the scene.
 */
const CLAIM_CASES: ClaimCase[] = [
  {
    scene: 'A cyclist is stopped at the roadside. Their bike is upside down and the rear wheel is off.',
    claim: '"The rear wheel has been removed."',
    benign: true,
    why: 'That is simply a restatement of what is visible. No cause, no intention, nothing added.',
  },
  {
    scene: 'A cyclist is stopped at the roadside. Their bike is upside down and the rear wheel is off.',
    claim: '"They have a puncture."',
    benign: false,
    why: 'A puncture is one explanation for a removed wheel — but so is a slipped chain, a brake adjustment, or a lift home in a small car. The scene shows the wheel, not the reason.',
  },
  {
    scene: 'A shop door has a handwritten sign reading "back in 10 minutes". The lights inside are on.',
    claim: '"There is a handwritten sign on the door and the interior lights are on."',
    benign: true,
    why: 'Both halves are directly observed. Reading a sign is observation; believing it is a separate step.',
  },
  {
    scene: 'A shop door has a handwritten sign reading "back in 10 minutes". The lights inside are on.',
    claim: '"The owner will be back within ten minutes."',
    benign: false,
    why: 'The sign is evidence about what someone wrote, not about what will happen. It may have been there an hour.',
  },
  {
    scene: 'In a classroom, one desk has a jumper over the chair and an open notebook on it.',
    claim: '"There is a jumper on the chair and an open notebook on the desk."',
    benign: true,
    why: 'A plain inventory of what is there, with nothing about whose it is or where they went.',
  },
  {
    scene: 'In a classroom, one desk has a jumper over the chair and an open notebook on it.',
    claim: '"Whoever sits there has stepped out and is coming back."',
    benign: false,
    why: 'Reasonable, and still an inference: it supplies a person, an absence and an intention, none of which are in the scene.',
  },
  {
    scene: 'Two mugs sit on a table, one empty and one half full. A chair is pushed back.',
    claim: '"One mug is empty, the other is half full, and a chair is not tucked in."',
    benign: true,
    why: 'Description only. The pushed-back chair is a fact about the chair, not about anyone leaving.',
  },
  {
    scene: 'Two mugs sit on a table, one empty and one half full. A chair is pushed back.',
    claim: '"Two people were here and one left in a hurry."',
    benign: false,
    why: 'Two mugs do not require two people, and a chair tells you nothing about hurry. This is a story built on top of the evidence.',
  },
]

const claimDiscernment = tpl(
  {
    id: 'obs-discernment',
    name: 'Observation or inference?',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: 8,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, CLAIM_CASES)
    const correct = c.benign
      ? 'Observation — it stays inside what the scene actually shows'
      : 'Inference — it adds a cause, a person or an intention the scene does not show'
    return {
      title: 'Observation or inference?',
      prompt:
        `Scene: ${c.scene}\n\nSomeone says: ${c.claim}\n\nIs that an observation or an inference?\n\n` +
        `About half of these stay inside the scene. "It is just an observation" is a real answer.`,
      answer: mcq(rng, correct, [
        c.benign
          ? 'Inference — it adds a cause, a person or an intention the scene does not show'
          : 'Observation — it stays inside what the scene actually shows',
        'Neither — the claim is too vague to classify',
        'Both — every observation is really an inference',
      ]),
      hints: [
        'Try to point at the part of the scene that makes the claim true. If your finger lands on something described, it is observation.',
        'Watch for smuggled words: causes ("because"), people who are not mentioned, and intentions ("about to", "in a hurry").',
        `Worked path: **${correct.split(' — ')[0]}**`,
      ],
      explanation:
        `**${correct}.** ${c.why}\n\n` +
        (c.benign
          ? 'Calling a plain description an inference is the mirror-image mistake, and it is not the safe one to make: if everything counts as inference then the distinction stops doing any work, and you lose the ability to say what you actually know.'
          : 'The inference may well be right. The point is only that it is a separate claim from the evidence, and separating them is what lets you notice later that you believed something you never actually saw.'),
    }
  },
)


/* ------------------------------------------- observer: two accounts */

interface AccountCase {
  event: string
  a: string
  b: string
  contradiction: boolean
  why: string
}

/**
 * Two people describing the same thing will always differ. Only some of those
 * differences are CONTRADICTIONS — claims that cannot both be true — and
 * treating every difference as one is how a careful observer turns into an
 * accusatory one. Half of these merely differ.
 */
const ACCOUNT_CASES: AccountCase[] = [
  {
    event: 'A parcel arrived at the office.',
    a: '"It came in the morning, before the meeting."',
    b: '"It was already on the desk when I got back from lunch."',
    contradiction: false,
    why: 'Both can be true at once: a parcel that arrived in the morning is still on the desk at lunchtime. Neither account rules the other out.',
  },
  {
    event: 'A parcel arrived at the office.',
    a: '"It came before the ten-o-clock meeting."',
    b: '"It had not arrived by the time I locked up at eleven."',
    contradiction: true,
    why: 'These cannot both hold. One places the arrival before ten, the other places it after eleven — the same parcel cannot do both.',
  },
  {
    event: 'A bus pulled into the stop.',
    a: '"It was a double-decker."',
    b: '"It was the number 14."',
    contradiction: false,
    why: 'Different details about the same bus, not competing ones. A number 14 can be a double-decker.',
  },
  {
    event: 'A bus pulled into the stop.',
    a: '"Nobody got off."',
    b: '"Two people got off and walked towards the station."',
    contradiction: true,
    why: 'Zero and two cannot both be the number who got off. One of these is wrong, though nothing here says which.',
  },
  {
    event: 'A meeting was rearranged.',
    a: '"She said Thursday would be easier."',
    b: '"She seemed reluctant to move it at all."',
    contradiction: false,
    why: 'Preferring Thursday and being reluctant to move are about different things — a preferred alternative and an attitude to changing. Both can be true of the same person in the same conversation.',
  },
  {
    event: 'A meeting was rearranged.',
    a: '"She suggested moving it herself."',
    b: '"She only agreed after we pushed for it."',
    contradiction: true,
    why: 'Who raised it first is a single fact and these give incompatible answers.',
  },
]

const accountDiscernment = tpl(
  {
    id: 'obs-accounts',
    name: 'Different, or contradictory?',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: 6,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ACCOUNT_CASES)
    const correct = c.contradiction
      ? 'A real contradiction — they cannot both be true'
      : 'Nothing is wrong — they differ, but both can be true'
    return {
      title: 'Two accounts',
      prompt:
        `${c.event}

One person says: ${c.a}
Another says: ${c.b}

` +
        `Do these accounts contradict each other?

` +
        `Accounts of the same event nearly always differ. Only some of those differences are contradictions.`,
      answer: mcq(rng, correct, [
        c.contradiction
          ? 'Nothing is wrong — they differ, but both can be true'
          : 'A real contradiction — they cannot both be true',
        'You cannot compare them without hearing a third account',
        'Any difference between two accounts is a contradiction',
      ]),
      hints: [
        'Ask one question: could BOTH statements be true at the same time? If yes, it is a difference, not a contradiction.',
        'Look for whether the two are even about the same fact — a time, a count, or who acted first — or about two different things.',
        `Worked path: **${correct}**`,
      ],
      explanation:
        `**${correct}.** ${c.why}

` +
        (c.contradiction
          ? 'Notice what a contradiction does and does not tell you: it establishes that at least one account is wrong, and nothing at all about which, or about anyone lying. People misremember constantly and honestly.'
          : 'Treating every difference as a contradiction is the more common mistake and the more expensive one. It manufactures conflicts that are not there, and it wastes the attention you would want for a real one.'),
    }
  },
)

export const DISCERNMENT_TEMPLATES: ItemTemplate[] = [askDiscernment, claimDiscernment, accountDiscernment]
