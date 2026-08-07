/**
 * Abduction — inference to the best explanation.
 *
 * The gap this fills: `i-logic` deduces from premises you are given,
 * `i-bayes` updates a hypothesis you already hold, and `i-hypo` tests rivals
 * you have already listed. Nothing taught GENERATING the candidate set, or
 * choosing between explanations that all fit the evidence.
 *
 * The two-step framing follows the standard account: abduction proposes the
 * candidates, and inference to the best explanation ranks them by explanatory
 * VIRTUES — chiefly scope (how much of the evidence it accounts for) and
 * parsimony (how many unsupported extra assumptions it needs), plus fit with
 * background knowledge. See docs/RESEARCH.md §19 for sources.
 *
 * Two guard rails, both deliberate:
 *
 * 1. NO PERSON-READING. The famous fictional version of this is "I deduce
 *    from your tan that you served in Afghanistan" — which is exactly the
 *    cold-reading and profiling this app refuses to teach. Every scenario
 *    here reasons about OBJECTS, PLACES and EVENTS. Where a person appears,
 *    the inference is about what happened, never about what they are like.
 * 2. THE LOVELIEST STORY IS NOT THE LIKELIEST. Left unqualified, "pick the
 *    best explanation" trains confident storytelling. The `abd-overreach`
 *    family exists to make the ceiling explicit: sometimes the correct move
 *    is to say the evidence does not decide.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, tpl } from '../lib'

// ---------------------------------------------------------------- scope

const explanatoryScope = tpl(
  {
    id: 'abd-scope',
    name: 'Explain all of it',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 5,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        traces:
          'You come home to: a wet patch under the kitchen window, the window shut, the plant on the sill knocked over, and the cat asleep on the counter.',
        correct: 'The cat knocked the plant over, spilling its water',
        wrong: [
          'Rain came through the window, which someone later closed',
          'A pipe under the sink is leaking and the water spread across the floor',
          'The plant was overwatered this morning and has been draining since',
        ],
        why: 'It is the only one that accounts for ALL four observations at once. Rain needs the window to have been open and then shut by someone. A pipe leak explains water but not a toppled plant. Overwatering explains water and nothing else.',
      },
      {
        traces:
          'The bike will not shift into the highest gears. The chain is clean and oiled, the rear wheel spins freely, and the shifter cable moves loosely when you squeeze it.',
        correct: 'The shifter cable has stretched, so the last part of its travel does nothing',
        wrong: [
          'The chain is worn out and skipping over the teeth',
          'The rear wheel is out of true and rubbing the frame',
          'The gears are dirty and need cleaning before they will engage',
        ],
        why: 'The loose cable is the observation the others ignore. A worn chain would skip in every gear, a rubbing wheel would not spin freely, and the chain is already clean — so two of the three contradict what you can see.',
      },
      {
        traces:
          'Your phone battery drained overnight. The screen-time log shows nothing after 11pm, the phone is warm, and it was on the charger the whole time.',
        correct: 'Something ran in the background hard enough to outpace the charger',
        wrong: [
          'You left the screen on all night by mistake',
          'The battery is old and no longer holds charge',
          'The charger came unplugged during the night',
        ],
        why: 'Warm plus on-charger plus no screen use is the combination. A left-on screen contradicts the log, an old battery would not make it warm, and an unplugged charger does not explain the heat either.',
      },
      {
        traces:
          'The classroom clock is 12 minutes slow. It was correct yesterday, its battery is new, and the clock beside it in the corridor is correct.',
        correct: 'The clock was stopped for about 12 minutes and then restarted',
        wrong: [
          'Its battery is running down and the clock is losing time steadily',
          'The whole building lost power briefly overnight',
          'Someone set it to the wrong time on purpose',
        ],
        why: 'A steady loss contradicts "correct yesterday" plus a new battery. A building-wide outage should have hit the corridor clock too. Deliberate mis-setting is possible, but a 12-minute offset is what a pause produces — and it needs no extra motive.',
      },
      {
        traces:
          'A potted seedling has yellow lower leaves, damp soil, and no new growth in two weeks. It sits well back from the only window.',
        correct: 'It is getting too little light and too much water at once',
        wrong: [
          'It needs fertiliser — the yellow is a nutrient shortage',
          'It is short of water and the leaves are drying out',
          'The pot is too small and the roots have run out of room',
        ],
        why: 'Damp soil rules out underwatering outright. A nutrient shortage or cramped roots could yellow the leaves, but neither explains damp soil AND a dark corner AND stalled growth together.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Which explanation covers everything?',
      prompt: `${c.traces}\n\nWhich explanation accounts for **all** of it?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'List the observations separately, then test each explanation against every one.',
        'A wrong explanation usually covers most of the evidence and quietly drops one item — find the dropped one.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThis is the first explanatory virtue: **scope**. An explanation that covers four observations out of five is not "nearly right" — the fifth observation is the one telling you it is wrong.`,
      commonErrors: {
        concept: 'Settling on the first explanation that fits some of the evidence, instead of testing every candidate against every observation.',
      },
    }
  },
)

// ---------------------------------------------------------------- parsimony

const parsimony = tpl(
  {
    id: 'abd-parsimony',
    name: 'Fewest coincidences',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 4,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'Your keys are missing. Yesterday you came in with shopping, and the keys are not on their hook.\n\nA: You put them down somewhere else while carrying bags.\nB: They fell out of your pocket on the walk home, someone found them, and posted them back through your door where they slid under the mat.',
        correct: 'A — it needs one ordinary lapse; B needs three separate lucky events',
        wrong: [
          'B — it explains why they are not on the hook in more detail',
          'Neither — without finding the keys there is no way to prefer either',
          'B — a stranger returning keys is a well-documented thing that happens',
        ],
        why: 'Both stories end with keys off the hook, so scope does not separate them. What separates them is how many unsupported extras each one needs. B needs a drop, a finder, and a delivery — each plausible alone, jointly a coincidence. Detail is not evidence; every added step is another thing that has to have happened.',
      },
      {
        setup:
          'A shop\'s takings are $20 short at closing.\n\nA: A till error — one transaction rung in wrong.\nB: A customer distracted the cashier while an accomplice reached over the counter, and both left before the next customer arrived.',
        correct: 'A — one mistake, versus a plan that needs two people and perfect timing',
        wrong: [
          'B — the coordinated version explains the exact amount better',
          'A — because theft is rare in shops generally',
          'Neither — $20 is too small an amount to reason about',
        ],
        why: 'Prefer A because it is simpler, not because theft is rare — that would be a base-rate argument, which is a different tool. Note what would overturn it instantly: the till tape, or footage. Parsimony picks the leading candidate; it does not close the case.',
      },
      {
        setup:
          'A group chat message you sent never got a reply from one friend.\n\nA: They have not opened the chat yet.\nB: They read it, were annoyed by the wording, decided not to reply, and are waiting to see whether you notice.',
        correct: 'A — B invents a whole inner story that nothing in the evidence supports',
        wrong: [
          'B — silence after a message usually means something is wrong',
          'Neither — you cannot judge without asking them directly',
          'B — it accounts for the timing better than simple inattention',
        ],
        why: 'B needs four assumptions about a mind you cannot see, and not one of them left a trace. This is where the habit earns its keep: the costly failures of explanation are usually elaborate stories about other people, built from an absence.',
      },
      {
        setup:
          'A file you saved yesterday is missing from the folder.\n\nA: It was saved to a different folder than you remember.\nB: A sync error deleted it from this device, and the backup has not run since, and the version history was also lost.',
        correct: 'A — one misremembering, against a chain of three independent failures',
        wrong: [
          'B — sync problems are extremely common with cloud storage',
          'A — because software is generally reliable',
          'Neither — the file is gone either way, so the reason does not matter',
        ],
        why: 'The reason matters a lot: A is fixed by searching, B by restoring a backup, and doing the wrong one first wastes the time. Chains of independent failures do happen — they are just far less likely than one ordinary slip, so they are where you look SECOND.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Which needs fewer coincidences?',
      prompt: `${c.setup}\n\nBoth stories fit what you can see. Which should you prefer, and why?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Both explanations already cover the evidence, so scope cannot separate them.',
        'Count the extra things each story needs you to accept without evidence.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThis is the second virtue: **parsimony** — the number of unsupported extra assumptions. A richly detailed story can feel more convincing precisely because it is more specific, which is the trap: every added detail is one more thing that must be true.`,
      transferBridge:
        'The same count applies to debugging, to arguments about who broke what at home, and to any news story that requires many people to have coordinated silently.',
      commonErrors: {
        concept: 'Treating a more detailed story as better supported. Detail is a cost, not evidence.',
      },
    }
  },
)

// ---------------------------------------------------------------- background knowledge

const backgroundKnowledge = tpl(
  {
    id: 'abd-background',
    name: 'What is it resting on?',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 3,
    variants: 4,
    minutes: 2.5,
  },
  (rng, seed) => {
    const cases = [
      {
        claim: 'The mug ring on the desk is from this morning, not yesterday.',
        correct: 'How fast a water ring dries on this surface',
        wrong: [
          'Who normally uses this desk in the mornings',
          'Whether the mug belongs to the person who sits here',
          'What was in the mug',
        ],
        why: 'The inference is entirely about drying time. Without knowing the rate, "this morning" is a guess dressed as a conclusion — and with it, the claim becomes checkable.',
      },
      {
        claim: 'This plant has been in the shade for weeks, judging by the long pale stems.',
        correct: 'That plants stretch and pale when they are short of light, and roughly how fast',
        wrong: [
          'Which room the plant was in before',
          'Who has been watering it',
          'Whether the pot has drainage holes',
        ],
        why: 'The whole inference rests on one botanical fact plus its timescale. Someone who does not know it sees a tall plant; someone who does reads weeks off it. That difference is knowledge, not cleverness.',
      },
      {
        claim: 'These footprints were made after the rain stopped.',
        correct: 'When the rain stopped, and what prints look like in wet versus drying ground',
        wrong: [
          'The shoe size and who owns shoes that size',
          'How many people walked past in total',
          'Whether the path is a shortcut people usually take',
        ],
        why: 'Two facts carry it: the timing of the weather and how ground records prints as it dries. Everything else is interesting but does not touch the claim.',
      },
      {
        claim: 'The bread did not rise because the kitchen was too cold.',
        correct: 'The temperature range yeast needs, and what the kitchen actually was',
        wrong: [
          'Which brand of flour was used',
          'Whether the recipe is a popular one',
          'How long the baker has been baking',
        ],
        why: 'Cold is one of several candidates — dead yeast, too much salt, not enough time. Naming the temperature range and measuring the room is what turns a hunch into a test that can fail.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Name the hidden requirement',
      prompt: `Someone concludes: **"${c.claim}"**\n\nWhat would you need to already KNOW for that inference to be any good?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ignore what would be merely interesting. Ask what the conclusion would collapse without.',
        'Most "deductions" are one specific fact plus a rate, a range, or a timescale.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThe fictional detective who reads a life story off a sleeve is doing this with an enormous store of specific knowledge — ash, soils, printing inks — memorised in advance. That is the real lesson, and it is the opposite of the "get generally smarter" myth: sharp inference in a domain is built from knowing that domain in detail. It also tells you what to do when you cannot make the inference. Go and learn the fact.`,
      transferBridge:
        'In any subject, "I cannot tell from this" and "I could tell if I knew X" are different positions, and the second one names your next move.',
    }
  },
)

// ---------------------------------------------------------------- the ceiling

const overreach = tpl(
  {
    id: 'abd-overreach',
    name: 'When the evidence will not decide',
    skillIds: ['i-abduce'],
    bucket: 'investigator',
    difficulty: 4,
    variants: 4,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'A window at the end of the corridor is broken. There is glass on the inside floor, a football in the bushes outside, and it is the week of a school match.',
        correct: 'The ball is the leading candidate, but glass inside only shows the break came from outside — several things do that',
        wrong: [
          'The football broke the window; the glass position proves it',
          'Nothing can be concluded — any object could have broken any window',
          'A person threw the ball deliberately, since the match makes it likely',
        ],
        why: 'Scope and parsimony do point at the ball. What they do not deliver is proof, and the glass tells you direction only. Naming the leading candidate AND its remaining gap is the honest report.',
      },
      {
        setup:
          'Two students hand in nearly identical wrong answers to the same unusual problem.',
        correct: 'Copying is one explanation; the same tutorial, the same tempting method, or the same misconception are others',
        wrong: [
          'They copied — identical wrong answers are conclusive',
          'It is a coincidence, since wrong answers are common',
          'The teacher set an unfair problem, which is why both failed',
        ],
        why: 'A shared WRONG answer feels damning, but a common misconception produces exactly the same fingerprint — that is what makes misconceptions worth teaching. Distinguishing them needs different evidence: ask each to explain their method.',
      },
      {
        setup:
          'Your team lost after switching to a new strategy in the second half.',
        correct: 'The strategy is a candidate, but one game cannot separate it from the opponent, luck, or fatigue',
        wrong: [
          'The strategy caused the loss — the timing shows it',
          'The strategy was fine; the players simply executed it badly',
          'Nothing about strategy can ever be judged from results',
        ],
        why: 'One trial with several things changing at once cannot isolate a cause — the same reason experiments control variables. The useful output is a TEST: run the strategy again against a comparable opponent.',
      },
      {
        setup:
          'A shop you liked has closed. A bigger chain opened nearby three months ago.',
        correct: 'Competition is plausible, but rent, retirement, illness and lease terms end shops too, and none of those are visible from outside',
        wrong: [
          'The chain drove them out — the timing is clear',
          'The owner must have been bad at running a business',
          'It is unknowable, so there is no point thinking about it',
        ],
        why: 'A visible cause arriving before a visible effect is the easiest story to reach for, and most of the real candidates here leave no trace a passer-by could see. "Plausible, unconfirmed, and here is what would confirm it" is the accurate position.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'How far does the evidence reach?',
      prompt: `${c.setup}\n\nWhat is the honest conclusion?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what OTHER explanation would produce exactly this evidence.',
        'The right answer is often "leading candidate, not proven" — with the gap named.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThis is the ceiling on the whole method. The explanation that would be most satisfying if true is not automatically the one most likely to be true — a caution philosophers call Voltaire's objection. Picking a best explanation ranks the candidates you thought of; it never proves one, and the strongest move stays available: name the leading candidate, name the gap, and name the test that would close it.`,
      commonErrors: {
        concept: 'Upgrading "best available explanation" to "proven", which is how a good habit turns into confident storytelling.',
      },
    }
  },
)

export const ABDUCTION_TEMPLATES: ItemTemplate[] = [explanatoryScope, parsimony, backgroundKnowledge, overreach]
