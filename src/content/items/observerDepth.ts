/**
 * OBSERVER — depth pass over the ten existing observer skills.
 *
 * Observer was the second-thinnest bucket in the bank: fifteen skills sharing
 * fifty question families, about 3.3 per skill against roughly 4.7 for
 * mathematics. Thin coverage matters more here than almost anywhere else,
 * because the evidence ladder needs distinct FAMILIES (not variants) before a
 * skill can be promoted at all — so a skill with two families is one authoring
 * accident away from being unpromotable. This file adds families only; it
 * introduces no new skill, no new unit, and no new KB card.
 *
 * WHAT EACH GROUP ADDS, AND WHY IT IS NOT A RESTATEMENT OF WHAT EXISTS
 *
 *  - `o-obsinf` (5). `observer.ts` already runs the Evidence Ledger forwards:
 *    here is a scene, sort the statements. This file adds a second scene bank
 *    in the same shape and then REVERSES the task — given a conclusion, name
 *    the single observation that would have to be true for it to stand. The
 *    reverse direction is the one that actually gets used outside the app: the
 *    conclusion arrives first, in somebody else's sentence, and the observation
 *    behind it is what has gone missing.
 *  - `o-recall` (4). Every item here uses a real `study` phase with
 *    `studySeconds`, so the scene is GONE when the question arrives. One family
 *    deliberately asks about details a normal reader would never have encoded;
 *    in half its variants the honest answer is "the scene never said", which
 *    makes "I did not notice" a scoreable answer rather than a failure. That is
 *    the same discernment logic as the audit's benign-answer gate: a recall
 *    bank where every question has a recallable answer trains guessing.
 *  - `o-listen` (4). Faithful paraphrase, tested from three directions: what a
 *    paraphrase ADDS, what it LOSES, and the specific move of upgrading a hedge
 *    ("maybe", "I think", "usually") into a flat claim. The hedge family exists
 *    because that is the failure that survives a listener's good intentions.
 *  - `o-bias` (4). DEFENCE against cold reading and Barnum statements, plus
 *    calibration as arithmetic rather than vocabulary: state a confidence,
 *    count what it predicts, compare against what happened. See SAFETY below.
 *  - `o-memory` (4). Structured encoding and the method of loci, each tested
 *    with recall AFTER an intervening task inside the same item, so the item
 *    measures what survived interference rather than what is still echoing in
 *    working memory.
 *  - `o-selection`, `o-expect`, `o-anchor`, `o-frame`, `o-claimtype` (3 each).
 *    These five are the `unseenLab.ts` unit. Every scenario here is new and
 *    every ASK is different from the four families that unit already carries;
 *    the design notes below name the specific non-overlap for each.
 *
 * EVIDENCE, AND ITS LIMITS
 *
 *  - Method of loci. Dresler et al. (2017, Neuron) trained mnemonic-naive
 *    adults for six weeks and found enduring gains in word-list recall still
 *    present at four months; a 2025 systematic review and meta-analysis in the
 *    British Journal of Psychology covers the wider literature. What that
 *    supports is ORDERED LIST recall, which is a real and useful skill. It does
 *    not support any claim about general ability, and the copy in
 *    `odepth-loci-delayed` says so in plain words.
 *  - Delayed retrieval. The benefit of retrieval practice over restudy grows
 *    with the retention interval, which is why the recall families here put a
 *    distractor task between study and test rather than asking immediately.
 *    The honest limit is transfer: retrieval practice reliably helps the same
 *    material and shows much weaker (often non-significant) benefits on
 *    never-before-seen application questions. Nothing here claims otherwise.
 *  - Barnum statements. `observer.ts` already cites Forer's 1948 demonstration;
 *    this file adds no new number and repeats none.
 *  - Calibration. `odepth-calibration-gap` is arithmetic, not psychology: at
 *    stated confidence c on n questions the predicted score is n·c/100, and the
 *    item compares that against what happened. No claim is made about whether
 *    practising this improves calibration in general.
 *
 * SAFETY — content law (CLAUDE.md §7, founding brief §6), not preference.
 * Observer teaches DEFENCE. The `o-bias` families here teach a learner to
 * RECOGNISE lines that fit everyone, to notice when a "reading" is repeating
 * facts the learner themselves supplied, and to ask what would make a claim
 * checkable. There is no instruction in composing such lines, no profiling, no
 * lie-detection "tells", and no technique to use on another person. No real
 * people, organisations or brands appear. No scenario in this file is
 * danger-adjacent: nothing places a young person under threat, pressure or
 * secrecy, so no frame-break is required — and none should be introduced by
 * editing a scenario into that territory.
 *
 * OPTION LENGTH. The bank has shipped the "correct answer is the longest one"
 * defect once (measured at 52.8% for a pick-the-longest strategy against a 25%
 * baseline) and, in a later file, its mirror image. Every multiple choice in
 * this file is written so the key is never the strictly longest option and
 * never the visibly shortest one, and so the key's length rank moves between
 * variants. The fix, always, is to rewrite a DECOY, never to clip the key.
 */
import type { ErrorTag, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, mcqNoted, multi, numeric, tpl } from '../lib'

/**
 * Rotate a decoy pool for a parameterised family whose closing question never
 * changes. Without this the conceptual MCQ at the end of an arithmetic item
 * shows one identical option set across every variant, so its length ranks are
 * frozen forever and a learner who reads them once has them for good. Each pool
 * below is written so every window of three contains at least one decoy longer
 * than the key and one shorter.
 */
function rotateDecoys(seed: number, pool: string[]): string[] {
  return [0, 1, 2].map((i) => pool[(seed + i) % pool.length])
}

/* ==================================================================
 * o-obsinf — observation, inference, and the road back
 * ================================================================== */

const LEDGER_LEVELS = ['Observed', 'Inferred', 'Unknown']

interface LedgerScene {
  scene: string
  statements: { text: string; category: number }[]
  note: string
}

/**
 * A second Evidence Ledger bank, in the same three-level shape as the original
 * so the two families reinforce one ladder rather than teaching two. Each scene
 * carries three Observed lines, one or two Inferred, and two Unknown — the
 * Inferred/Unknown boundary is where the learning is, so the Observed lines are
 * deliberately easy and act as anchors.
 */
const LEDGER_SCENES: LedgerScene[] = [
  {
    scene:
      'The art room at 4:05 pm. Two easels stand by the window, one holding a half-painted canvas of a harbour. A palette on the stool carries blue and white paint that is still glossy. A jar of brushes stands in cloudy water. The supply cupboard door is open and the light inside it is on.',
    statements: [
      { text: 'The canvas is half painted and shows a harbour', category: 0 },
      { text: 'Somebody was painting in this room recently', category: 1 },
      { text: 'The painter is coming back to finish the canvas', category: 2 },
      { text: 'The supply cupboard door is open', category: 0 },
      { text: 'The blue and white paint is still glossy', category: 0 },
      { text: 'The blue and white were mixed for the sky', category: 2 },
    ],
    note: 'Glossy paint has not had time to dry, which makes recent work a strong inference — but you observed the shine, not the painter. What the paint was FOR, and whether anyone returns, the room cannot settle.',
  },
  {
    scene:
      'A corner shop counter at 8:40 am. Three newspapers are left in the stack and the wire rack beside it is empty. A cardboard sign taped to the till reads "card machine down — cash only". A handwritten list on the counter has four items crossed out and two not.',
    statements: [
      { text: 'The sign on the till says cash only', category: 0 },
      { text: 'The card machine is not working today', category: 1 },
      { text: 'Three newspapers remain in the stack', category: 0 },
      { text: 'The papers have sold well this morning', category: 2 },
      { text: 'Two items on the list are not crossed out', category: 0 },
      { text: 'The list belongs to the person behind the counter', category: 2 },
    ],
    note: 'The sign is the observation; a broken card machine is what the sign REPORTS, which is one step further out. Three papers left says nothing about how many there were at seven.',
  },
  {
    scene:
      'A garden shed, mid-morning. A bag of compost stands open with a trowel resting in it. Six empty plant pots are stacked by the door, and one pot beside them holds soil and a small green shoot. A pair of gloves lies palm-up on the bench with soil on the fingers. One corner of the window has a crack across it.',
    statements: [
      { text: 'One pot holds soil and a small green shoot', category: 0 },
      { text: 'Somebody has been potting a plant in here', category: 1 },
      { text: 'The gloves were worn by whoever did the potting', category: 2 },
      { text: 'A crack runs across one corner of the window', category: 0 },
      { text: 'Six empty pots are stacked beside the door', category: 0 },
      { text: 'The crack in the window appeared this morning', category: 2 },
    ],
    note: 'Open compost, a used trowel and a freshly filled pot converge on potting. The gloves are the trap: soil on gloves in a shed full of soil is not evidence about who wore them, and a crack has no date on it.',
  },
  {
    scene:
      'The music room at lunchtime. A stool is pushed back from the drum kit; one stick lies across the snare and the other is on the floor. Sheet music on the stand is open at page 4, with a pencil mark in the third bar. The window is closed and the room is warm.',
    statements: [
      { text: 'One stick is on the snare and one on the floor', category: 0 },
      { text: 'Somebody has been playing this drum kit', category: 1 },
      { text: 'The pencil mark shows where they kept going wrong', category: 2 },
      { text: 'The sheet music is open at page 4', category: 0 },
      { text: 'The room is warm and the window is closed', category: 0 },
      { text: 'Whoever was playing left the room in a hurry', category: 2 },
    ],
    note: 'A pushed-back stool and sticks out of their case make recent playing a strong inference. A pencil mark could be a fingering, a cue, a reminder, or somebody else\'s note from last term — several stories fit equally, which is the definition of unknown.',
  },
  {
    scene:
      'A car park at 7:15 am. Nine of the forty spaces are filled. Frost covers the windscreens of six of those nine cars; three windscreens are clear. A trolley bay by the entrance holds four trolleys. A sign at the barrier lists a two-hour limit.',
    statements: [
      { text: 'Nine of the forty spaces are filled', category: 0 },
      { text: 'The three clear cars arrived more recently', category: 1 },
      { text: 'Frost covers six of the nine windscreens', category: 0 },
      { text: 'The frosted cars were left here overnight', category: 2 },
      { text: 'A sign at the barrier lists a two-hour limit', category: 0 },
      { text: 'The car park is usually this empty at 7:15', category: 2 },
    ],
    note: 'Frost takes time to form, so clear glass points to a recent arrival. Overnight is a much bigger claim than "a while ago", and one morning tells you nothing about a usual morning.',
  },
  {
    scene:
      'A kitchen table at 6 pm. An open exercise book shows eight completed questions and a ninth with two crossed-out attempts. A calculator sits face-up with 47 on the display. A glass of water is half full and a phone lies screen-down beside it.',
    statements: [
      { text: 'Eight questions are completed in the exercise book', category: 0 },
      { text: 'Question nine has been attempted twice already', category: 0 },
      { text: 'Question nine is harder than the eight before it', category: 2 },
      { text: 'The calculator has been used at this table', category: 1 },
      { text: 'The calculator display is showing 47', category: 0 },
      { text: 'The phone was turned over to avoid distraction', category: 2 },
    ],
    note: 'A number sitting on the display means somebody pressed keys, which is why "used" is an inference rather than a guess. Two crossings-out could be difficulty, carelessness, or a changed method; a face-down phone could be habit or the shape of the table.',
  },
  {
    scene:
      'A sports hall at 5:30 pm. A net is set up across the middle. A bag of twelve shuttlecocks sits open at the side and three shuttlecocks lie on the floor on one side of the net. Two racquets rest against the wall. The scoreboard reads 11 to 7.',
    statements: [
      { text: 'The scoreboard is showing 11 to 7', category: 0 },
      { text: 'A game has been played on this court', category: 1 },
      { text: 'The player on 11 is the stronger player', category: 2 },
      { text: 'Three shuttlecocks are lying on the floor', category: 0 },
      { text: 'Two racquets are resting against the wall', category: 0 },
      { text: 'The game ended with a score of 11 to 7', category: 2 },
    ],
    note: 'A set-up net, used shuttlecocks and a non-zero scoreboard make a played game a strong inference. Whether 11 to 7 is a final score or a game abandoned halfway is exactly what a scoreboard cannot tell you.',
  },
  {
    scene:
      'A library returns desk at 9:10 am. A crate holds eleven books, and the top one has a slip of paper sticking out at page 30. A stamp and ink pad sit closed beside a mug with steam rising from it. A sign reads "returns after 9 — please queue".',
    statements: [
      { text: 'The crate on the desk holds eleven books', category: 0 },
      { text: 'Somebody is working at or near this desk', category: 1 },
      { text: 'Steam is rising from the mug on the desk', category: 0 },
      { text: 'The last reader of the top book reached page 30', category: 2 },
      { text: 'The sign says returns are taken after 9', category: 0 },
      { text: 'All eleven books came back this morning', category: 2 },
    ],
    note: 'A hot drink goes cold, so steam is decent evidence that somebody is about. A slip of paper is a bookmark, a receipt, a request slip or a scrap — it does not report how far anybody read.',
  },
]

const ledgerTwo = tpl(
  {
    id: 'odepth-ledger-scenes',
    name: 'Evidence ledger — second bank',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 2,
    variants: LEDGER_SCENES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = cycle(seed, LEDGER_SCENES)
    return {
      title: 'Observed, inferred, or unknown?',
      prompt:
        `Read the scene, then label each statement.\n\n> ${s.scene}\n\n` +
        '**Observed** = the scene states it directly. **Inferred** = the scene does not state it, but strongly supports it. **Unknown** = several stories fit the scene equally well.',
      answer: classify(rng, LEDGER_LEVELS, s.statements),
      hints: [
        'Take the Observed ones first: can you put a finger on the exact words in the scene?',
        'For the rest, ask how many different stories would produce this same scene. One story left standing is an inference; several is unknown.',
        `Worked path: ${s.statements.map((st) => `"${st.text}" → ${LEDGER_LEVELS[st.category]}`).join('; ')}.`,
      ],
      explanation:
        `${s.statements.map((st) => `**${LEDGER_LEVELS[st.category]}**: ${st.text}`).join('. ')}.\n\n${s.note}\n\n` +
        'The three levels are not degrees of confidence. They record how the claim got into your head: read off the scene, built from it, or supplied by you. Confidence can be high on an inference and that is fine — what is not fine is losing track of which is which, because when a scene turns out to be different from what you assumed, only the observations survive.',
    }
  },
)

interface AccountScene {
  scene: string
  observations: string[]
  beyond: string[]
  note: string
}

/**
 * The same distinction as a multi-select rather than a sort, and against a
 * WRITTEN ACCOUNT rather than the scene itself. That is the form the skill
 * takes in the wild: somebody hands you six sentences about something you did
 * not see, and three of them are theirs rather than the world's.
 */
const ACCOUNT_SCENES: AccountScene[] = [
  {
    scene:
      'A bike is lying on its side on the grass beside the path. The chain is off the front sprocket. A water bottle is a couple of metres away in the grass. The path has loose gravel across one stretch.',
    observations: [
      'The bike is on its side on the grass',
      'The chain is off the front sprocket',
      'Loose gravel lies across part of the path',
    ],
    beyond: [
      'The rider came off on the loose gravel',
      'The bottle was thrown clear in the fall',
      'The rider was going too fast for the path',
    ],
    note: 'A dropped chain can happen while riding, while stopping, or while somebody lifted the bike over a fence. The gravel is real; the crash is a story built to join it to the bike.',
  },
  {
    scene:
      'The classroom door has a printed note taped at eye height reading "Lesson moved to Room 12". The lights are off. The whiteboard still shows a diagram from a previous lesson. A stack of chairs stands in one corner.',
    observations: [
      'A note on the door names Room 12',
      'The lights in the room are switched off',
      'A diagram is still on the whiteboard',
    ],
    beyond: [
      'The teacher wrote the note this morning',
      'The lesson moved because this room was double-booked',
      'Nobody has taught in this room today',
    ],
    note: 'A printed note carries no author and no time. Off lights are consistent with an empty room now and say nothing about the last eight hours.',
  },
  {
    scene:
      'A shared kitchen. Two mugs stand in the sink, one with tea stains and one clean-looking. The kettle is warm to the touch. A biscuit packet on the side is open with three biscuits left. A chair is pulled out from the table.',
    observations: [
      'Two mugs are standing in the sink',
      'The kettle is warm to the touch',
      'Three biscuits are left in the open packet',
    ],
    beyond: [
      'Two people had a drink here together',
      'Whoever it was left in the last few minutes',
      'The clean-looking mug was never used',
    ],
    note: 'Two mugs might be two people, or one person across two days. A warm kettle narrows the time down but "the last few minutes" is a precision the kettle cannot supply.',
  },
  {
    scene:
      'A returned parcel sits on a doorstep. The tape along one edge has been cut and re-taped with a different, wider tape. The label is smudged across the postcode. A delivery card is wedged under the doormat.',
    observations: [
      'The parcel has been re-taped with wider tape',
      'The label is smudged across the postcode',
      'A delivery card is wedged under the mat',
    ],
    beyond: [
      'The parcel was opened and resealed by somebody',
      'The smudged postcode is why it came back',
      'The card was left by the same delivery driver',
    ],
    note: 'Different tape is compatible with an opened parcel and equally with a repair at the depot after a split. The smudge and the return are two facts; "because" is the part you added.',
  },
  {
    scene:
      'A phone lies on a park bench with 4% battery showing and a cracked screen protector. A dog lead is looped over the arm of the bench. Wet footprints lead from the puddle by the bench towards the gate.',
    observations: [
      'The phone shows 4% battery remaining',
      'A dog lead is looped over the bench arm',
      'Wet footprints lead towards the gate',
    ],
    beyond: [
      'The phone owner walked off towards the gate',
      'The crack happened when the phone was dropped here',
      'The lead and the phone belong to one person',
    ],
    note: 'Footprints record feet, not owners. A screen protector cracks in a pocket, in a bag, or against a bench, and nothing here dates it.',
  },
  {
    scene:
      'A vending machine in a corridor. The coin slot is covered with masking tape. The display reads "CARD ONLY". Rows B and C are empty; rows A and D are full. A folded receipt is caught under the flap.',
    observations: [
      'Masking tape covers the coin slot',
      'Rows B and C of the machine are empty',
      'A folded receipt is caught under the flap',
    ],
    beyond: [
      'The coin mechanism has broken down',
      'Rows B and C hold the popular items',
      'The last buyer paid by card and dropped the receipt',
    ],
    note: 'Tape over a slot could be a fault, a refill in progress, or a decision about cash. Empty rows could be popularity, or two rows nobody has restocked.',
  },
  {
    scene:
      'A laptop is open on a desk with 63 browser tabs shown across the top. A charger is plugged into the wall but not into the laptop. A notebook beside it is open at a page headed "Plan" with three bullet points, all unticked.',
    observations: [
      'The laptop shows 63 tabs across the top',
      'The charger is plugged in at the wall only',
      'Three bullet points sit under the heading Plan',
    ],
    beyond: [
      'The person working here is disorganised',
      'The three bullet points were never started',
      'The laptop was unplugged in a rush to leave',
    ],
    note: 'An unticked box records the absence of a tick, not the absence of work. Sixty-three tabs is a count, and calling it disorganised is a judgement about a person you have not met.',
  },
  {
    scene:
      'A garden gate is standing open with a bungee cord hanging loose from the post. Two bins are out on the pavement, one on its side. A trail of leaves runs from a pile by the wall towards the gate.',
    observations: [
      'The gate is open and the cord hangs loose',
      'One of the two bins is lying on its side',
      'Leaves trail from the pile towards the gate',
    ],
    beyond: [
      'The wind blew the gate open in the night',
      'The bin was knocked over by the same gust',
      'The leaf pile was swept up earlier today',
    ],
    note: 'Wind is one plausible cause among several — a bin lorry, a passer-by, a badly latched gate. Leaves move in wind, in a draught, and under a wheel.',
  },
]

const observationSelect = tpl(
  {
    id: 'odepth-observation-select',
    name: 'Select every observation',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 2,
    variants: ACCOUNT_SCENES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, ACCOUNT_SCENES)
    return {
      title: 'What did the scene actually give you?',
      prompt:
        `You arrive at this:\n\n> ${c.scene}\n\nA friend writes six lines about it. Select **every** line that reports only what the scene shows.\n\nExactly three of the six do.`,
      answer: multi(rng, c.observations, c.beyond),
      hints: [
        'Read each line beside the scene and ask whether you could point at the words that say it.',
        'Any line naming a cause, a reason, an owner or a person\'s character has left the scene behind, however likely it sounds.',
        `Worked path: the three observations are "${c.observations.join('", "')}".`,
      ],
      explanation:
        `The three that stay inside the scene: ${c.observations.map((o) => `**${o}**`).join(', ')}.\n\n${c.note}\n\n` +
        'Notice that the three you rejected are not silly. Each is the most natural story available, which is exactly why they slip through — an account written this way reads as a description while being half explanation. The repair is mechanical: write the observations first, in a separate list, and let the explanation come second where it can be argued with.',
    }
  },
)

interface ReverseCase {
  conclusion: string
  correct: string
  wrong: [text: string, note: string, tag: ErrorTag][]
  why: string
}

/**
 * The ledger, run backwards. Forwards ("is this observed or inferred?") is the
 * classroom version; backwards ("what would have had to be true?") is the one
 * that gets used, because conclusions arrive already assembled and the
 * observation underneath them is the part that went missing in transit.
 *
 * Every distractor is a real observation that is CONSISTENT with the
 * conclusion. Only the key is one the conclusion could not survive without.
 */
const REVERSE_CASES: ReverseCase[] = [
  {
    conclusion: 'The parcel was delivered to the wrong house.',
    correct: 'The door in the delivery photo is not your door',
    wrong: [
      ['The parcel was marked delivered at 2:14 pm', 'A timestamp is compatible with every address in the street.', 'inference'],
      ['Nothing was waiting on your doorstep when you got home', 'An empty step also fits a theft, or a neighbour taking it in.', 'inference'],
      ['The driver did not ring the doorbell at all', 'A silent delivery happens at the right house just as often.', 'misread'],
    ],
    why: 'Wrong house is a claim about WHERE, so only an observation about the place can carry it. Time, absence and doorbells are all true in the correct-delivery world too.',
  },
  {
    conclusion: 'The heating came on during the night.',
    correct: 'The radiator was warm before anyone touched it',
    wrong: [
      ['The thermostat is set to twenty degrees now', 'A setting is an instruction, not a record of what happened.', 'concept'],
      ['The house felt warmer than it did on the previous night', 'How a house feels tracks bedding, weather and sleep too.', 'inference'],
      ['The boiler is making a noise this morning', 'Morning noise is about this morning, not about the night.', 'misread'],
    ],
    why: 'Heat in the metal is the only listed thing that could not be there unless the system ran. Everything else would be equally true after a cold night.',
  },
  {
    conclusion: 'Somebody borrowed the calculator from the drawer.',
    correct: 'The drawer is empty where the calculator sat',
    wrong: [
      ['Three people were working in the room today', 'People in a room is opportunity, and opportunity is not an event.', 'inference'],
      ['The drawer was left standing open a couple of inches', 'An open drawer is equally what you leave behind yourself.', 'inference'],
      ['The calculator has been borrowed before now', 'History raises the odds and settles nothing about today.', 'strategy'],
    ],
    why: 'Borrowing implies the thing is gone, so the absence is the load-bearing observation. An open drawer with the calculator still in it kills the conclusion outright.',
  },
  {
    conclusion: 'The plant died from lack of water rather than lack of light.',
    correct: 'The soil was dry all the way to the bottom',
    wrong: [
      ['The plant stood in a corner away from the window', 'That is evidence for the rival explanation, not against it.', 'strategy'],
      ['The leaves went yellow and then dropped off', 'Yellow leaves are the shared symptom of both stories.', 'concept'],
      ['The plant had not been watered for two weeks', 'A gap in your memory of watering is not the soil itself.', 'inference'],
    ],
    why: 'The conclusion picks between two causes, so it needs an observation the two causes disagree about. Dry soil throughout is one; yellow leaves are produced by either.',
  },
  {
    conclusion: 'The message was sent before the meeting started.',
    correct: 'The message timestamp is earlier than 4 pm',
    wrong: [
      ['The message mentions the agenda for the meeting', 'You can write about an agenda at any point in the day.', 'inference'],
      ['The meeting was scheduled to start at 4 pm', 'A schedule fixes the meeting, not when the message went.', 'misread'],
      ['The reply came through during the meeting itself', 'A reply during is compatible with a message during too.', 'inference'],
    ],
    why: 'Before is a comparison between two times, and only the pair of timestamps supplies both sides of it.',
  },
  {
    conclusion: 'The window was broken from the outside.',
    correct: 'The glass fragments landed on the inside floor',
    wrong: [
      ['A stone was found lying under the window frame', 'A stone can be lying there for reasons that predate this.', 'inference'],
      ['The window is a ground-floor one facing the street', 'Reachability is opportunity again, and not the event.', 'inference'],
      ['The break has a rough hole near the middle', 'A hole in the middle is what both directions produce.', 'concept'],
    ],
    why: 'Direction is the whole claim, and glass travels away from the impact. Where the fragments landed is the one observation that distinguishes outside from inside.',
  },
  {
    conclusion: 'The cake was taken out of the oven too early.',
    correct: 'The middle was still wet when it was cut',
    wrong: [
      ['The timer had eleven minutes left on it', 'A timer records a plan, and plans get changed for reasons.', 'concept'],
      ['The top of the cake was pale rather than golden', 'Pale tops come from a cool oven and from low sugar too.', 'inference'],
      ['This recipe has never been baked in this oven', 'Novelty makes an error likelier and does not observe one.', 'strategy'],
    ],
    why: 'Underbaked is a claim about the inside, so the inside is what has to be looked at. A pale top and an unfinished timer are both consistent with a cake that is perfectly cooked.',
  },
  {
    conclusion: 'The two essays were written by the same person.',
    correct: 'Both essays contain the same unusual sentence',
    wrong: [
      ['Both essays argue for exactly the same conclusion', 'A shared conclusion is what a set task produces.', 'inference'],
      ['The two essays were handed in on the same day', 'One deadline explains that without any shared author.', 'misread'],
      ['Both essays are about the same length in words', 'A word limit makes matching lengths the default result.', 'inference'],
    ],
    why: 'A common task explains a shared topic, a shared deadline and a shared length. What it does not explain is an unusual string of words appearing twice.',
  },
]

const reverseObservation = tpl(
  {
    id: 'odepth-reverse-observation',
    name: 'Which observation is the conclusion standing on?',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: REVERSE_CASES.length,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, REVERSE_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Work backwards to the evidence',
      prompt: `Somebody concludes:\n\n> ${c.conclusion}\n\nAll four observations below are true. Which one does the conclusion actually need — the one that, if it turned out false, would take the conclusion down with it?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Take each observation in turn and imagine it is false. Does the conclusion still stand?',
        'Three of them would be just as true if the conclusion were wrong, which means they are not holding it up.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The three you can drop are the reason this is worth practising. They are genuinely true, genuinely relevant-sounding, and they pile up into a feeling of a well-evidenced conclusion — while every one of them is equally at home in the world where the conclusion is wrong. Load-bearing evidence is the evidence you would lose the conclusion without, and it is usually one item, not five.',
    }
  },
)

interface RewriteCase {
  note: string
  correct: string
  wrong: string[]
  why: string
}

/**
 * Rewriting rather than sorting. A learner who can label a sentence "inference"
 * has not necessarily got a sentence they could put in its place, and the
 * replacement is the actual deliverable — a note somebody else can check.
 */
const REWRITE_CASES: RewriteCase[] = [
  {
    note: '"The upstairs neighbour was up all night stomping around again."',
    correct: 'I heard footsteps overhead between 1 am and 3 am',
    wrong: [
      'The neighbour upstairs was walking about for most of the night',
      'There was loud stomping from upstairs during the night again',
      'My neighbour was noisy again last night',
    ],
    why: 'Footsteps overhead is what a listener downstairs can actually register. Who was walking, whether they slept, how heavy the steps were meant to be and whether it has happened before are all additions.',
  },
  {
    note: '"My brother deleted the file to get out of doing his half."',
    correct: 'The shared file is missing and he opened it last',
    wrong: [
      'My brother got rid of the file so he would not have to work',
      'My brother deleted the shared file',
      'Someone deleted the shared file on purpose to avoid the work',
    ],
    why: 'Missing plus a last-opened record is the whole of what the folder shows. Deletion, agency and motive are three separate additions stacked on top of it.',
  },
  {
    note: '"The shop assistant ignored me because I came in with my school bag."',
    correct: 'I waited at the counter and was not served for six minutes',
    wrong: [
      'The assistant decided not to serve me while other people were served',
      'I was ignored at the counter for several minutes with my bag on',
      'The assistant ignored me for a while',
    ],
    why: 'A wait is timeable and a reason is not. Being unserved is compatible with a queue system, a phone order, a break, or the assistant not seeing you at all.',
  },
  {
    note: '"Our team lost because the referee was against us from the start."',
    correct: 'Six fouls were given against us and two against them',
    wrong: [
      'The referee gave far more decisions against our team than theirs',
      'The referee was biased against our team',
      'The referee was making one-sided calls right through the match',
    ],
    why: 'A count of fouls is a record. Whether the count reflects bias, a rougher game, or one player having a bad afternoon is a question the count opens rather than answers.',
  },
  {
    note: '"The bus driver saw me running and shut the doors on purpose."',
    correct: 'The doors closed as I reached the back of the bus',
    wrong: [
      'The driver closed the doors just as I was about to get on board',
      'The bus doors were shut deliberately while I was still running',
      'The driver shut the doors on me',
    ],
    why: 'Where you were when the doors moved is observable. What the driver saw, and what the driver intended, are two things happening inside somebody else.',
  },
  {
    note: '"Nobody read my message in the group chat."',
    correct: 'My message has no replies and no reactions on it',
    wrong: [
      'Nobody bothered to read my message',
      'Everybody in the chat scrolled past my message without reading',
      'The group ignored what I posted and carried on with other things',
    ],
    why: 'Replies and reactions are countable; reading is not visible at all. Silence is the observation, and it is the same silence whether twelve people read it or none did.',
  },
  {
    note: '"The printer jams every single time I use it."',
    correct: 'It jammed on three of my last four print jobs',
    wrong: [
      'The printer keeps jamming whenever I try to print anything at all',
      'Every print job I have sent recently has ended up jamming',
      'The printer always jams on me',
    ],
    why: '"Every single time" is a claim about all cases, and three from four is what was actually seen. Shrinking the quantifier to the evidence is usually the whole repair.',
  },
  {
    note: '"She left early because she was bored of the whole thing."',
    correct: 'She left about twenty minutes before the end',
    wrong: [
      'She got up and left before the end because she was not enjoying it',
      'She walked out early, which showed how she felt about the event',
      'She got bored and left early',
    ],
    why: 'A departure time is a fact and boredom is an internal state. Early exits come from buses, headaches, work, and boredom, and the room cannot tell you which.',
  },
]

const stripTheInference = tpl(
  {
    id: 'odepth-strip-inference',
    name: 'Rewrite it as what you saw',
    skillIds: ['o-obsinf', 'o-listen'],
    bucket: 'observer',
    difficulty: 3,
    variants: REWRITE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, REWRITE_CASES)
    return {
      title: 'Strip it back to the observation',
      prompt: `Somebody writes this down:\n\n> ${c.note}\n\nWhich rewrite keeps only what could actually have been observed?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Cross out every word about a reason, a purpose or somebody\'s state of mind, then see what is left.',
        'Three of the rewrites sound more careful while keeping a claim about cause or intention. Hunt for the words "because", "on purpose", "deliberately", "would not", and "every".',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The wrong options are the interesting part: each one softens the TONE without removing the claim. Sounding measured and being measured are different things, and the test is not how careful a sentence feels — it is whether somebody who was not there could check it. The stripped version is also the more useful one to say out loud, because it invites a correction instead of an argument.',
    }
  },
)

/**
 * Counting, then ranking. The count forces every statement to be examined
 * rather than pattern-matched, and the second part goes after the specific
 * confusion the three-level ladder exists to fix: an inference that is very
 * strongly supported still is not an observation, and picking the STRONGEST
 * inference is a different judgement from picking a fact.
 */
interface BeyondCase {
  scene: string
  lines: string[]
  beyondCount: number
  strongest: string
  weaker: string[]
  why: string
}

const BEYOND_CASES: BeyondCase[] = [
  {
    scene:
      'A cinema foyer at 9:50 pm. The doors of screen 3 are propped open and a cleaner is pushing a trolley towards them. Popcorn is scattered across two rows visible from the door. The board lists screen 3 as "Next showing 10:15".',
    lines: [
      'The doors of screen 3 are propped open',
      'A showing in screen 3 has just finished',
      'Popcorn is scattered across two rows',
      'The board lists the next showing at 10:15',
      'The audience for that showing was a large one',
      'The cleaner will be finished before 10:15',
    ],
    beyondCount: 3,
    strongest: 'A showing in screen 3 has just finished',
    weaker: [
      'The audience for that showing was a large one',
      'The cleaner will be finished in time for 10:15',
      'The popcorn was dropped by more than one person',
    ],
    why: 'Open doors, a cleaner arriving and a mess inside converge on a finished showing and very little else. Audience size, future timing and how many people spilled things are each one more step out.',
  },
  {
    scene:
      'A school corridor at 8:35 am. A trophy cabinet has a shelf with a rectangular dust-free patch and no trophy on it. A caretaker\'s ladder leans against the wall two metres away. The cabinet door is unlocked. A sign on the noticeboard reads "Presentation assembly — Friday".',
    lines: [
      'One shelf has a dust-free rectangle and no trophy',
      'A trophy has been removed from that shelf recently',
      'The cabinet door is unlocked',
      'The trophy was taken for Friday\'s assembly',
      'A ladder leans against the wall nearby',
      'The caretaker was the person who opened the cabinet',
    ],
    beyondCount: 3,
    strongest: 'A trophy has been removed from that shelf recently',
    weaker: [
      'The trophy was taken out ready for Friday\'s assembly',
      'The caretaker is the person who opened the cabinet',
      'The trophy will be back on the shelf by Monday',
    ],
    why: 'Dust settles, so a clean rectangle where an object stood is close to a direct reading of "it was here and now is not". Why it went and who moved it are supplied by the assembly poster and the ladder, which are coincidences until something links them.',
  },
  {
    scene:
      'A campsite in the morning. One tent is down and packed into a bag; the pegs are in a pile beside it. A second tent is still up with its door zipped. A cool box stands open and empty with the lid resting against it. Tyre marks run from the pitch to the track.',
    lines: [
      'One tent is packed and one is still standing',
      'The pegs are stacked in a pile beside the packed tent',
      'Somebody has left the campsite this morning',
      'The cool box was emptied before it was left open',
      'The tyre marks were made by the people who left',
      'A cool box stands open and empty by the pitch',
    ],
    beyondCount: 3,
    strongest: 'Somebody has left the campsite this morning',
    weaker: [
      'The tyre marks were made by the people who packed up',
      'The cool box was deliberately emptied before leaving',
      'The remaining tent belongs to a different group',
    ],
    why: 'A packed tent with its pegs out is about as close to "somebody has gone" as a campsite gets. Whose tyres, who emptied what, and how many groups there ever were, the pitch does not record.',
  },
  {
    scene:
      'A kitchen at 7 am. The bread bag is open with the tie beside it. Two slices of toast sit in the rack, cold to the touch. The butter has a knife left in it. A school bag by the door is fastened and standing upright.',
    lines: [
      'The bread bag is open with the tie beside it',
      'Somebody made toast in this kitchen already',
      'Two slices of toast are cold in the rack',
      'The toast was made for the person with the bag',
      'A fastened school bag stands by the door',
      'Whoever made the toast has now left the house',
    ],
    beyondCount: 3,
    strongest: 'Somebody made toast in this kitchen already',
    weaker: [
      'The toast was made for the owner of the school bag',
      'Whoever made the toast has already left the house',
      'The toast went cold because it was forgotten about',
    ],
    why: 'Toast in a rack did not toast itself, so the making is barely a step. Who it was for, where they are now, and why it is cold all require a person the kitchen never shows you.',
  },
  {
    scene:
      'A workshop bench. A jar labelled "M4 bolts" is on its side with bolts scattered across the bench and four on the floor. A spanner lies across the bench edge. A drawing pinned above the bench shows a frame with the bolt positions circled.',
    lines: [
      'The bolt jar is on its side with bolts scattered',
      'Four bolts are lying on the floor',
      'The jar was knocked over rather than emptied out',
      'A spanner lies across the edge of the bench',
      'Somebody was working from the pinned drawing',
      'The spanner is what knocked the jar over',
    ],
    beyondCount: 3,
    strongest: 'The jar was knocked over rather than emptied out',
    weaker: [
      'Somebody was working from the drawing pinned above',
      'The spanner is the thing that knocked the jar over',
      'The bolts on the floor were the first ones to fall',
    ],
    why: 'A jar on its side with bolts trailing away from it, some over the edge, is what a knock looks like and not what a deliberate pour looks like. Which tool did it, and whether anyone was following the drawing at all, are stories the bench allows but does not tell.',
  },
  {
    scene:
      'A bus shelter in the afternoon. A timetable behind glass has today\'s date circled in marker. Six people stand waiting and two are looking up the road. A puddle in the gutter is still rippling. The digital display is blank.',
    lines: [
      'Today\'s date is circled on the timetable',
      'Six people are waiting at the shelter',
      'The digital display is not showing anything',
      'The bus these people want has not arrived yet',
      'The display is broken rather than switched off',
      'A puddle in the gutter is still rippling',
    ],
    beyondCount: 2,
    strongest: 'The bus these people want has not arrived yet',
    weaker: [
      'The display is broken rather than being switched off',
      'The circled date means the timetable changed today',
      'The people waiting have been there for a long while',
    ],
    why: 'Six people standing and two watching the road is close to "the bus is not here". A blank display has at least three explanations and a marker circle has more, so neither can be read as one.',
  },
  {
    scene:
      'A hallway after a party. Twenty-two paper cups are lined along the windowsill. A speaker is unplugged with its cable coiled. One shoe sits by the door. The rug has been rolled back against the wall and the floor beneath it is scuffed.',
    lines: [
      'Twenty-two cups are lined along the windowsill',
      'The rug is rolled back against the wall',
      'Somebody tidied the cups rather than leaving them',
      'The scuffs came from people dancing on the floor',
      'The speaker is unplugged with its cable coiled',
      'The owner of the single shoe left without it',
    ],
    beyondCount: 3,
    strongest: 'Somebody tidied the cups rather than leaving them',
    weaker: [
      'The scuff marks came from people dancing on the floor',
      'The owner of the single shoe left the house without it',
      'The rug was rolled back to make room for dancing',
    ],
    why: 'Twenty-two cups in a line is an arrangement, and arrangements have hands behind them. What the floor was scuffed by, and whether a shoe by a door is lost or waiting, are exactly the details a story wants and the hallway will not confirm.',
  },
  {
    scene:
      'A garage. A car bonnet is up and a torch lies on the engine, still on. A jump-lead pack sits open on the floor with one clamp uncoiled. A phone charger is plugged into a socket with no phone attached. The garage door is half open.',
    lines: [
      'The car bonnet is up and a torch is lit on the engine',
      'A jump-lead pack is open with one clamp uncoiled',
      'Somebody is part-way through working on this car',
      'The car would not start this morning',
      'The garage door is half open',
      'The person working here has gone to fetch something',
    ],
    beyondCount: 3,
    strongest: 'Somebody is part-way through working on this car',
    weaker: [
      'The car failed to start earlier on this morning',
      'The person working here has gone to fetch something',
      'The jump leads were being used on this car',
    ],
    why: 'A lit torch and an unfinished set-up is an interruption, which is about as safe as an inference gets. A flat battery is one reason among many for open jump leads, and where a missing person went is not written anywhere in the garage.',
  },
]

const howFarBeyond = tpl(
  {
    id: 'odepth-how-far-beyond',
    name: 'Count what goes beyond the scene',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: BEYOND_CASES.length,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, BEYOND_CASES)
    return {
      title: 'How far past the scene?',
      prompt: `Read the scene, then work through the two questions.\n\n> ${c.scene}\n\nSix lines were written about it:\n\n${c.lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`,
      parts: [
        {
          prompt: 'How many of the six lines say something the scene does not state directly? Give a whole number.',
          answer: numeric(c.beyondCount, { unit: 'lines' }),
          explanation: `**${c.beyondCount} of the six** go past what is written in the scene. Counting forces you to test every line separately, which is the point: skimming a list of six produces a feeling about the list, and the feeling is usually one or two out.`,
          hints: [
            'Go through the six one at a time and mark each as "in the scene" or "not in the scene".',
            'A line is in the scene only if you can point at the words. Anything about cause, purpose, ownership or the future is not.',
            `Worked path: ${6 - c.beyondCount} lines are read straight off the scene, so ${c.beyondCount} are not.`,
          ],
        },
        {
          prompt: 'Of the lines that go beyond the scene, which one is the best supported — the inference you would defend if you had to pick one?',
          answer: mcq(rng, c.strongest, c.weaker),
          explanation: `**${c.strongest}.** ${c.why}\n\nThis part is not asking you to promote it to a fact. A strong inference is still an inference, and the reason to rank them is practical: when you have to act on an incomplete scene, you act on the best-supported story while keeping it labelled, so that the first contradicting detail can knock it over without taking your whole picture with it.`,
          hints: [
            'Ask how many different situations would produce this scene while the line is FALSE. Fewer means stronger.',
            'The strongest inference is usually the one closest to the physical evidence, not the one that explains the most.',
            `Worked path: **${c.strongest}**.`,
          ],
        },
      ],
      hints: [
        'The first part is a count; go line by line rather than judging the list as a whole.',
        'The second part ranks the ones you rejected — being beyond the scene is not the same as being a wild guess.',
        'Nothing here asks you to decide what really happened.',
      ],
      explanation:
        `${c.beyondCount} of the six lines go beyond the scene, and the strongest of those is **${c.strongest}**. ${c.why}\n\n` +
        'Two habits are being separated here. The first is noticing that a line is an inference at all, which is a yes-or-no test. The second is grading inferences against each other, which is what lets you act without pretending to certainty. People who skip the first habit have no idea which parts of their picture are theirs; people who skip the second freeze, because everything that is not certain gets treated as worthless.',
    }
  },
)

/* ==================================================================
 * o-recall — study, lose the scene, then answer
 * ================================================================== */

/**
 * A deterministic display order for an ordering task that is guaranteed not to
 * BE the answer. Alphabetical almost never coincides with a narrative sequence,
 * but "almost never" is not a property to rely on across a growing bank, so the
 * degenerate case is handled rather than hoped away.
 */
function scrambledDisplay(items: string[]): string[] {
  const sorted = [...items].sort()
  return sorted.every((s, i) => s === items[i]) ? [...sorted].reverse() : sorted
}

interface SequenceScene {
  study: string
  events: string[]
  note: string
}

/**
 * Order memory is a different store from item memory: people who can list every
 * object in a scene routinely cannot say which happened first, because sequence
 * has to be encoded deliberately (a running commentary, a numbered chain) and
 * objects do not. An ordering answer is the only format that tests it — a
 * multiple choice about "what happened first" can be answered from one memory.
 */
const SEQUENCE_SCENES: SequenceScene[] = [
  {
    study:
      'THE CAFE WINDOW. You watch for two minutes. A waiter wipes the corner table. A man in a green coat comes in and stands at the counter. The waiter carries two plates out to the terrace. The man in the green coat sits down at the wiped table. A child at the terrace knocks over a glass.',
    events: [
      'The waiter wipes the corner table',
      'A man in a green coat comes in',
      'The waiter carries two plates outside',
      'The man in the green coat sits down',
      'A child knocks a glass over outside',
    ],
    note: 'The table is wiped before the man arrives, and the plates go out between his arriving and his sitting. Those two middles are where sequences collapse.',
  },
  {
    study:
      'THE BUS STOP. The display changes from 4 minutes to 2 minutes. A woman folds her newspaper and stands up. The bus pulls in and the doors open. A cyclist rides past the front of the bus. The woman gets on and the doors close.',
    events: [
      'The display changes to 2 minutes',
      'A woman folds her paper and stands',
      'The bus pulls in and the doors open',
      'A cyclist rides past the front of the bus',
      'The woman boards and the doors close',
    ],
    note: 'The cyclist arrives between the doors opening and the woman boarding, which is the detail that gets dropped: an event that changes nothing is the easiest one to lose.',
  },
  {
    study:
      'THE KITCHEN. The oven timer beeps. Someone turns the radio down. The oven door opens and a tray comes out. A second person walks in carrying a bag of shopping. The tray is set on the rack by the window.',
    events: [
      'The oven timer beeps',
      'Someone turns the radio down',
      'The oven door opens and a tray comes out',
      'A second person walks in with shopping',
      'The tray is set on the rack by the window',
    ],
    note: 'The radio goes down between the beep and the door, and the shopping arrives between the tray coming out and the tray being set down. Both are interruptions, and interruptions get filed under "somewhere in the middle".',
  },
  {
    study:
      'THE LIBRARY DESK. A student puts three books on the counter. The librarian scans the top two. A phone rings behind the desk. The librarian answers it and holds up one finger. The student takes back the third book and walks away with it.',
    events: [
      'A student puts three books on the counter',
      'The librarian scans the top two books',
      'A phone rings behind the desk',
      'The librarian answers and holds up a finger',
      'The student takes the third book away',
    ],
    note: 'Only two of the three books were scanned before the phone rang, and the order is what makes that matter. A scene remembered as a set of facts loses the reason the third book left unscanned.',
  },
  {
    study:
      'THE PLATFORM. An announcement says the train is delayed. Two people leave through the exit. A guard walks down the platform closing doors on a stationary train. The announcement repeats. A third person runs down the stairs and stops at the edge.',
    events: [
      'An announcement says the train is delayed',
      'Two people leave through the exit',
      'A guard walks down closing doors',
      'The announcement repeats',
      'A third person runs down the stairs',
    ],
    note: 'The repeat splits the guard from the runner. Repeated events are the hardest thing to place, because the second one merges into the memory of the first.',
  },
  {
    study:
      'THE CLASSROOM. The teacher writes a date on the board. A student hands in a folder at the desk. The bell rings for the start of the lesson. The teacher hands back a stack of marked sheets. A window blows shut at the far end of the room.',
    events: [
      'The teacher writes a date on the board',
      'A student hands in a folder',
      'The bell rings for the start of the lesson',
      'The teacher hands back marked sheets',
      'A window blows shut at the far end',
    ],
    note: 'Two things happen BEFORE the bell, which is the trap: a bell feels like a beginning, so anything before it tends to be remembered as after it.',
  },
  {
    study:
      'THE GARDEN. A watering can is filled at the outside tap. A cat crosses the lawn and goes under the hedge. Three pots by the wall are watered in turn. The tap is left dripping and is turned off. A neighbour calls something over the fence.',
    events: [
      'A watering can is filled at the tap',
      'A cat crosses the lawn to the hedge',
      'Three pots by the wall are watered',
      'The dripping tap is turned off',
      'A neighbour calls over the fence',
    ],
    note: 'The tap is used at the start and dealt with in the fourth position, not the second. An object appearing twice pulls its two moments together in memory.',
  },
  {
    study:
      'THE SHOP. A delivery box is carried in and put by the till. The shopkeeper serves a customer buying milk. The box is opened with a knife. A second customer comes in and waits. Tins from the box are stacked on the bottom shelf.',
    events: [
      'A delivery box is carried in to the till',
      'The shopkeeper serves a milk customer',
      'The box is opened with a knife',
      'A second customer comes in and waits',
      'Tins are stacked on the bottom shelf',
    ],
    note: 'The box is opened after the first customer and before the second arrives. Nothing about the box explains where the customers go, which is why sequence has to be stored as sequence.',
  },
]

const sceneSequence = tpl(
  {
    id: 'odepth-recall-sequence',
    name: 'Rebuild the sequence',
    skillIds: ['o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: SEQUENCE_SCENES.length,
    minutes: 3.5,
    kind: 'multi',
    calibration: true,
  },
  (_rng, seed) => {
    const s = cycle(seed, SEQUENCE_SCENES)
    const display = scrambledDisplay(s.events)
    const correct = s.events.map((e) => display.indexOf(e))
    return {
      title: 'What happened, in what order',
      prompt: 'Watch the scene below. When it disappears you will be asked to put the five events back in the order they happened.',
      parts: [
        {
          study: `${s.study}\n\nEncode the ORDER, not just the events — a running commentary in your head ("first… then… while that was happening…") is what stores sequence.`,
          studySeconds: 40,
          prompt: 'Put the five events back into the order they happened.',
          answer: { type: 'order', options: display, correct },
          explanation: `The order was: ${s.events.join(' → ')}. ${s.note}`,
          hints: [
            'Find the event you are surest about and place it first, then work outwards from it.',
            'Say the chain out loud as a sentence with "then" between the parts — an order you can say is an order you can check.',
            `Worked path: ${s.events.join(' → ')}.`,
          ],
        },
      ],
      hints: [
        'While studying, narrate rather than photograph: the words "and then" are what store an order.',
        'Two events that changed nothing are still two events, and they are the ones that slide.',
        'No worked path exists before you answer — the sequence is in the explanation afterwards.',
      ],
      explanation:
        `The order was: ${s.events.join(' → ')}. ${s.note}\n\n` +
        'Objects and order are stored differently, and only one of them is stored for free. A scene watched passively leaves you a pile of facts with the arrows missing, which is why a witness can be completely honest and completely wrong about what led to what. The fix is not to look harder; it is to narrate while you watch.',
    }
  },
)

interface UnstatedScene {
  study: string
  firstAsk: string
  firstKey: string
  firstWrong: string[]
  firstWhy: string
  secondAsk: string
  /** The true description, used as the key when the scene did state it. */
  stated: string
  /** Two wrong descriptions of the same length class as `stated`. */
  alternatives: string[]
  /** The honest answer when the scene never specified it. */
  unstated: string
  /** Did the study text actually specify the detail asked about second? */
  wasStated: boolean
  secondWhy: string
}

/**
 * "I did not notice" as a scoreable answer.
 *
 * A recall bank where every question has a recallable answer teaches guessing,
 * because the learner learns that an answer always exists. Four of these eight
 * variants ask about a detail the scene genuinely specified and four ask about
 * one it deliberately left open — the option set is IDENTICAL in both cases and
 * only the key moves, so "the scene never said" cannot be read off the wording.
 * This is the same discernment principle as the audit's benign-answer gate.
 */
const UNSTATED_SCENES: UnstatedScene[] = [
  {
    study:
      'THE WAITING ROOM. Six chairs line the wall and four are taken. A low table holds three magazines fanned out and an empty paper cup. A wall clock reads 11:20. A woman by the door has a rucksack at her feet. A noticeboard lists opening hours ending at 5:30.',
    firstAsk: 'How many of the six chairs were taken?',
    firstKey: 'Four of the six were taken',
    firstWrong: ['Three of the six were taken', 'Five of the six were taken', 'Two of the six were taken'],
    firstWhy: 'Four were taken out of six. Counts survive better than colours, and they still need saying to yourself once.',
    secondAsk: 'What colour was the rucksack at the woman\'s feet?',
    stated: 'It was described as black',
    alternatives: ['It was described as dark brown', 'It was described as bottle green'],
    unstated: 'The scene never gave a colour',
    wasStated: false,
    secondWhy: 'The rucksack was mentioned and never described. A colour arriving in your head now is reconstruction, not memory — and it will feel exactly as vivid as a real one.',
  },
  {
    study:
      'THE MARKET STALL. A crate of red apples sits beside a crate of pears. A chalkboard price sign reads "£2 a bag". A blue awning is rolled halfway out. The stallholder wears fingerless gloves and is counting coins into a tin. Two paper bags are tucked under the scales.',
    firstAsk: 'What did the chalkboard price sign say?',
    firstKey: 'It read two pounds a bag',
    firstWrong: ['It read three pounds a bag', 'It read two pounds a kilo', 'It read one pound a bag'],
    firstWhy: 'The sign read £2 a bag. Both the number and the unit have to be stored, and swapping the unit is the commonest way a price memory goes wrong.',
    secondAsk: 'What colour was the awning over the stall?',
    stated: 'It was described as blue',
    alternatives: ['It was described as red', 'It was described as grey'],
    unstated: 'The scene did not give a colour',
    wasStated: true,
    secondWhy: 'The awning WAS described, as blue. Half the questions in this family ask about something the scene never specified, so refusing to answer is sometimes right — and here it would have thrown away a detail you actually had.',
  },
  {
    study:
      'THE STUDY DESK. A laptop is open beside a stack of four library books. A mug with a chipped handle sits on a coaster. A desk lamp is switched on and angled at the books. A phone lies face-down on the windowsill. A wall calendar is turned to a page with two dates circled.',
    firstAsk: 'How many library books were in the stack?',
    firstKey: 'There were four in the stack',
    firstWrong: ['There were three in the stack', 'There were five in the stack', 'There were six in the stack'],
    firstWhy: 'Four books. Small counts feel automatic and are not — an unspoken count decays as fast as anything else.',
    secondAsk: 'What subject were the library books about?',
    stated: 'They were described as history',
    alternatives: ['They were described as biology', 'They were described as physics'],
    unstated: 'The scene gave no subject',
    wasStated: false,
    secondWhy: 'The books were counted and never opened. If a subject came to mind, notice how easily it arrived — a plausible detail fills a gap without announcing that it is doing so.',
  },
  {
    study:
      'THE HOTEL LOBBY. A revolving door turns slowly at the entrance. A green suitcase stands beside the desk with a luggage tag hanging from the handle. A bowl of oranges sits on the counter. A lift indicator shows floor 3. Two armchairs face a switched-off television.',
    firstAsk: 'What did the lift indicator show?',
    firstKey: 'The indicator showed floor 3',
    firstWrong: ['The indicator showed floor 5', 'The indicator showed floor 2', 'The indicator showed floor 8'],
    firstWhy: 'Floor 3. A single digit is the easiest thing in a scene to lose, because there is nothing to hang it on.',
    secondAsk: 'What colour was the suitcase by the desk?',
    stated: 'It was described as green',
    alternatives: ['It was described as black', 'It was described as cream'],
    unstated: 'The scene gave no colour at all',
    wasStated: true,
    secondWhy: 'The suitcase WAS green. Answering "not stated" here is the mirror-image error, and it is not the safe one: a rule of always refusing scores the same as a rule of always guessing.',
  },
  {
    study:
      'THE SWIMMING POOL. A lane rope divides two lanes and one lane is empty. A whistle hangs from a hook by the steps. Three kickboards are stacked on a trolley. The clock on the far wall reads 6:45. A pair of goggles lies on the tiles near the deep end.',
    firstAsk: 'What time did the clock on the far wall read?',
    firstKey: 'The clock read 6:45',
    firstWrong: ['The clock read 6:54', 'The clock read 7:45', 'The clock read 5:45'],
    firstWhy: '6:45. The wrong options are digit swaps, which is precisely how remembered times corrupt.',
    secondAsk: 'How many people were swimming in the busy lane?',
    stated: 'There were three of them swimming',
    alternatives: ['There were two of them swimming', 'There were five of them swimming'],
    unstated: 'The scene never said how many',
    wasStated: false,
    secondWhy: 'One lane was called empty and the other was never counted. A scene can imply that people exist without ever telling you how many, and the gap is invisible unless you look for it.',
  },
  {
    study:
      'THE ALLOTMENT. A wooden shed has a padlock hanging open on the hasp. Runner beans climb a row of seven canes. A watering can with a yellow rose sits by the water butt. A robin is on the fence post. A wheelbarrow holds a fork and a coil of green twine.',
    firstAsk: 'How many canes were the beans climbing?',
    firstKey: 'The beans climbed seven canes',
    firstWrong: ['The beans climbed five canes', 'The beans climbed eleven canes', 'The beans climbed six canes'],
    firstWhy: 'Seven canes. Odd numbers above five are where casual counting gives up and rounds.',
    secondAsk: 'What colour was the rose on the watering can?',
    stated: 'It was described as yellow',
    alternatives: ['It was described as silver', 'It was described as copper'],
    unstated: 'The scene gave no colour for it',
    wasStated: true,
    secondWhy: 'It WAS yellow, and it is the sort of decorative detail people assume they missed. Assuming you missed something is a memory judgement too, and it can be wrong in both directions.',
  },
  {
    study:
      'THE STAIRWELL. A fire door is propped open with a wooden wedge. A handrail has a strip of tape wrapped around one section. A window on the half-landing is open two inches. A bucket and mop stand against the wall. A notice at eye level reads "Floor 2".',
    firstAsk: 'What did the notice at eye level read?',
    firstKey: 'The notice read Floor 2',
    firstWrong: ['The notice read Floor 4', 'The notice read Exit 2', 'The notice read Floor 12'],
    firstWhy: '"Floor 2". Short printed text is stored as a shape unless you say it, and shapes confuse easily.',
    secondAsk: 'What colour was the tape on the handrail?',
    stated: 'It was described as red',
    alternatives: ['It was described as bright white', 'It was described as navy blue'],
    unstated: 'The scene gave no colour here',
    wasStated: false,
    secondWhy: 'Tape was mentioned; a colour was not. Tape is such a colourful object in ordinary life that the mind supplies one before you have finished asking the question.',
  },
  {
    study:
      'THE FERRY DECK. A row of orange lifebuoys is fixed along the rail. A folded map sticks out of a bin by the door. Two gulls sit on a bollard. A chalked board announces the next crossing at 14:10. A rope is coiled in a figure of eight on the deck.',
    firstAsk: 'When was the next crossing announced for?',
    firstKey: 'The next crossing was 14:10',
    firstWrong: ['The next crossing was 14:01', 'The next crossing was 15:10', 'The next crossing was 14:40'],
    firstWhy: '14:10, and the decoys are the three ways a four-digit time falls apart in memory.',
    secondAsk: 'What colour were the lifebuoys on the rail?',
    stated: 'They were described as orange',
    alternatives: ['They were described as yellow', 'They were described as red'],
    unstated: 'The scene gave no colour here',
    wasStated: true,
    secondWhy: 'They WERE orange. It is worth noticing that you would have guessed orange anyway, because lifebuoys usually are — a correct answer arrived at by expectation is not a memory, even when it scores.',
  },
]

const notEnoughNoticed = tpl(
  {
    id: 'odepth-recall-not-noticed',
    name: 'Recall, including what you never had',
    skillIds: ['o-recall', 'o-bias'],
    bucket: 'observer',
    difficulty: 3,
    variants: UNSTATED_SCENES.length,
    minutes: 4,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const s = cycle(seed, UNSTATED_SCENES)
    const secondKey = s.wasStated ? s.stated : s.unstated
    const secondWrong = s.wasStated ? [s.unstated, ...s.alternatives] : [s.stated, ...s.alternatives]
    return {
      title: 'Study, then answer honestly',
      prompt:
        'Study the scene below. When it disappears you will answer two questions from memory.\n\n' +
        'One warning worth having in advance: some questions in this family ask about details the scene never gave. "It was never said" is a real answer here, and it is the right one about half the time.',
      parts: [
        {
          study: s.study,
          studySeconds: 40,
          prompt: s.firstAsk,
          answer: mcq(rng, s.firstKey, s.firstWrong),
          explanation: `**${s.firstKey}.** ${s.firstWhy}`,
          hints: [
            'Rebuild the scene in the order you read it rather than searching for the answer directly.',
            'If two options both feel possible, that feeling is information: it means the detail was not encoded firmly.',
            'No worked path exists for a memory question — the explanation follows your answer.',
          ],
        },
        {
          prompt: s.secondAsk,
          answer: mcq(rng, secondKey, secondWrong),
          explanation: `**${secondKey}.** ${s.secondWhy}\n\nThe useful skill here is not recall at all. It is telling the difference between remembering something and being able to picture it, and those two feel identical from the inside.`,
          hints: [
            'Before choosing, ask whether the scene gave this detail at all — an answer cannot be remembered if it was never there.',
            'A picture forming in your head is not evidence: imagination fills gaps in the same format memory uses.',
            'Half of these questions are about details the scene left open, and half are not.',
          ],
        },
      ],
      hints: [
        'Encode in one sweep: objects, then numbers and printed text, then which details are missing.',
        'The second question is the interesting one — check whether the scene ever supplied that detail.',
        'Answering "never said" when it WAS said costs exactly as much as guessing when it was not.',
      ],
      explanation:
        `The scene ${s.wasStated ? 'DID' : 'did NOT'} specify the detail in the second question, and the answer is **${secondKey}**. ${s.secondWhy}\n\n` +
        'Most memory practice trains one direction: hold more. This trains the other one, which is knowing the edge of what you hold. A witness who says "I did not see" is more useful than a witness who produces a plausible colour, and the two are not distinguishable by how confident they feel — which is why the edge has to be checked deliberately rather than sensed.',
    }
  },
)

interface CountScene {
  study: string
  countAsk: string
  count: number
  countUnit: string
  countWhy: string
  placeAsk: string
  placeKey: string
  placeWrong: string[]
  placeWhy: string
}

/**
 * Counts and positions, because they fail differently from objects. An object
 * is remembered as a label; a count has to be taken at the time (memory does
 * not re-count a picture) and a position has to be bound to its object, which
 * is the binding that goes first.
 */
const COUNT_SCENES: CountScene[] = [
  {
    study:
      'THE NOTICEBOARD. Nine sheets are pinned up. Four are on the left half and five on the right. A timetable in the top-left corner has a red border. A lost-property notice sits at the bottom right. Two drawing pins with no paper on them are stuck in the middle of the board.',
    countAsk: 'How many sheets were pinned to the board altogether?',
    count: 9,
    countUnit: 'sheets',
    countWhy: 'Nine sheets: four on the left and five on the right. A total given in two halves has to be added while you are looking, because memory will not add it for you afterwards.',
    placeAsk: 'Where was the timetable?',
    placeKey: 'In the top-left corner of the board',
    placeWrong: ['In the bottom-left corner of it', 'In the top-right corner of the board', 'In the middle of the whole board'],
    placeWhy: 'The timetable was top-left. Position is stored as a binding between object and place, and the binding decays faster than either half of it.',
  },
  {
    study:
      'THE TOOL WALL. Six screwdrivers hang in a row above the bench. Two hammers hang to the left of them and a hand saw to the right. A roll of tape sits on the shelf below. Three of the screwdrivers have yellow handles and the rest are black.',
    countAsk: 'How many screwdrivers were hanging above the bench?',
    count: 6,
    countUnit: 'screwdrivers',
    countWhy: 'Six screwdrivers, three yellow-handled and three black. A count split by a property is two facts, and people usually keep the property and drop the total.',
    placeAsk: 'Where was the hand saw?',
    placeKey: 'To the right of the screwdrivers',
    placeWrong: ['To the left of the two hammers', 'On the shelf below the bench', 'Between the screwdrivers and hammers'],
    placeWhy: 'The saw hung to the right of the screwdrivers. Left and right survive only if you say them; otherwise the wall is remembered as a set of tools with no map.',
  },
  {
    study:
      'THE PARK PATH. Eight benches line the path. Three of them face the pond and the rest face the path. A bin stands beside the second bench. A signpost at the far end lists three destinations. Two bicycles are locked to the railing near the entrance.',
    countAsk: 'How many benches were along the path?',
    count: 8,
    countUnit: 'benches',
    countWhy: 'Eight benches, three facing the pond. Once a subset is mentioned, the subset is what sticks and the total quietly leaves.',
    placeAsk: 'Where was the bin?',
    placeKey: 'Beside the second bench along',
    placeWrong: ['Beside the last bench on the path', 'Next to the signpost at the end', 'By the railing near the entrance'],
    placeWhy: 'The bin stood by the second bench. An ordinal position is the hardest kind to hold, because nothing about a bin makes "second" memorable.',
  },
  {
    study:
      'THE FRIDGE DOOR. Twelve magnets hold up seven pieces of paper. A takeaway menu is at the top left. A child\'s drawing covers most of the middle. Two appointment cards are at the bottom, side by side. A shopping list hangs from a clip on the handle.',
    countAsk: 'How many pieces of paper were held up by magnets?',
    count: 7,
    countUnit: 'pieces of paper',
    countWhy: 'Seven pieces of paper held by twelve magnets. Two counts in one sentence interfere with each other, and the second one usually wins.',
    placeAsk: 'Where were the two appointment cards?',
    placeKey: 'At the bottom, side by side',
    placeWrong: ['At the top beside the menu', 'On the clip on the door handle', 'In the middle over the drawing'],
    placeWhy: 'The two cards were at the bottom, next to each other. Objects that come in pairs are remembered as a pair and lose their location first.',
  },
  {
    study:
      'THE STATIONERY DRAWER. Five pens lie loose. A pack of highlighters holds four, one of which is missing. A ruler runs along the back edge of the drawer. Two erasers sit in the front-left corner. A roll of sticky tape has no cutter on it.',
    countAsk: 'How many loose pens were in the drawer?',
    count: 5,
    countUnit: 'pens',
    countWhy: 'Five loose pens. The highlighter pack is a separate count and it is there to interfere — an adjacent number is the most effective distractor there is.',
    placeAsk: 'Where were the two erasers?',
    placeKey: 'In the front-left corner of it',
    placeWrong: ['Along the back edge of the drawer', 'In the front-right corner of it', 'Underneath the pack of highlighters'],
    placeWhy: 'Front-left. Corners feel distinctive while you look and become interchangeable within a minute of not looking.',
  },
  {
    study:
      'THE SHOE RACK. Four pairs of shoes sit on the rack and one odd shoe is on the floor beside it. A pair of boots stands at the left end. Trainers are at the right end with the laces tucked in. An umbrella leans against the wall behind the rack.',
    countAsk: 'How many complete pairs were on the rack?',
    count: 4,
    countUnit: 'pairs',
    countWhy: 'Four complete pairs, plus one odd shoe on the floor that is not part of them. Pairs and singles need counting separately or they merge into "about nine shoes".',
    placeAsk: 'Where were the boots?',
    placeKey: 'At the left end of the rack',
    placeWrong: ['At the right end of the rack', 'On the floor beside the rack', 'Behind the rack against the wall'],
    placeWhy: 'The boots were at the left end and the trainers at the right. Two ends and two objects is a binding problem, and swapped ends is the standard failure.',
  },
  {
    study:
      'THE CAKE STALL. Three trays sit on the table. The first holds six buns, the second holds four slices and the third is empty. A cash tin sits at the near end with a price list taped to the lid. A stack of napkins is weighted down by a jar.',
    countAsk: 'How many buns were on the first tray?',
    count: 6,
    countUnit: 'buns',
    countWhy: 'Six buns on the first tray and four slices on the second. Two counts on two trays swap round constantly, so binding the number to the tray while looking is the whole task.',
    placeAsk: 'Where was the cash tin?',
    placeKey: 'At the near end of the table',
    placeWrong: ['At the far end of the table', 'On the empty third tray', 'Beside the weighted stack of napkins'],
    placeWhy: 'The tin was at the near end. Near and far are relative to you, and a memory replayed from a different angle loses them.',
  },
  {
    study:
      'THE GREENHOUSE. Ten seed trays sit on the staging, six on the upper shelf and four below. A thermometer hangs at the far end reading 21 degrees. A hose is coiled under the staging. Labels are pushed into three of the trays.',
    countAsk: 'How many seed trays were on the upper shelf?',
    count: 6,
    countUnit: 'trays',
    countWhy: 'Six on the upper shelf and four below, ten in total. Three numbers describing one set is the point of the item: the question asks for one of them, not the total.',
    placeAsk: 'Where was the thermometer?',
    placeKey: 'At the far end of the greenhouse',
    placeWrong: ['Under the staging with the hose', 'By the door at the near end', 'On the upper shelf with the trays'],
    placeWhy: 'The thermometer hung at the far end. A single object with a number on it competes with the counts, and one of them usually loses.',
  },
]

const countAndPlace = tpl(
  {
    id: 'odepth-recall-count-place',
    name: 'How many, and where',
    skillIds: ['o-recall'],
    bucket: 'observer',
    difficulty: 2,
    variants: COUNT_SCENES.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const s = cycle(seed, COUNT_SCENES)
    return {
      title: 'Counts and positions',
      prompt: 'Study the scene. When it goes, you will be asked for one count and one position — so encode both while you can.',
      parts: [
        {
          study: `${s.study}\n\nCount things out loud in your head as you read, and say each position as a phrase ("bin — second bench"). A count you did not take cannot be taken later from the picture.`,
          studySeconds: 35,
          prompt: s.countAsk,
          answer: numeric(s.count, { unit: s.countUnit }),
          explanation: `**${s.count}.** ${s.countWhy}`,
          hints: [
            'Rebuild the scene from one end to the other rather than trying to see the whole thing at once.',
            'If a subtotal comes back but not the total, add the subtotals — that is often what was actually stored.',
            'No worked path for a memory question; the count is in the explanation.',
          ],
        },
        {
          prompt: s.placeAsk,
          answer: mcq(rng, s.placeKey, s.placeWrong),
          explanation: `**${s.placeKey}.** ${s.placeWhy}`,
          hints: [
            'Place yourself back where you were standing, then look in one direction at a time.',
            'If the object comes back but its place does not, that is the binding failing — a very common and very specific miss.',
            'The position is given in the explanation once you have answered.',
          ],
        },
      ],
      hints: [
        'Two different jobs while studying: count the countable things, and say where the odd ones are.',
        'A count is taken at the time or not at all — memory stores the number, not a picture it can re-count.',
        'Positions need words: "left end", "second along", "far corner".',
      ],
      explanation:
        `The count was **${s.count} ${s.countUnit}**, and the position was **${s.placeKey}**.\n\n${s.countWhy} ${s.placeWhy}\n\n` +
        'Notice which of the two you got. Missing the count and holding the position means you looked at objects and never quantified; the reverse means you took numbers and lost the map. Those are different repairs, and knowing which one is yours is worth more than the score.',
    }
  },
)

interface PresentScene {
  study: string
  present: string[]
  absent: string[]
  note: string
}

/**
 * Rejecting a plausible absent detail is where recall is weakest, because
 * familiarity and memory feel identical from the inside — an item that FITS the
 * scene generates the same warm sense of recognition as one that was in it.
 * Every absent option below belongs to the scene's world, so the only way to
 * reject it is to have encoded the scene rather than its category.
 */
const PRESENT_SCENES: PresentScene[] = [
  {
    study:
      'THE CAMPER VAN. A kettle is strapped into a bracket by the sink. A folding table is stowed against the back door. Two sleeping bags are rolled at the far end. A paper map is wedged above the sun visor. A cool box sits behind the driver\'s seat.',
    present: ['A kettle strapped by the sink', 'A paper map above the sun visor', 'Two rolled-up sleeping bags'],
    absent: ['A gas stove on the worktop', 'A pair of walking boots by the door', 'A torch hanging from a hook'],
    note: 'Every absent item belongs in a camper van, which is exactly the problem: the scene was about a van, so anything van-shaped feels remembered.',
  },
  {
    study:
      'THE SCIENCE BENCH. A tripod stands over an unlit burner. A beaker holds clear liquid to the 200 ml line. A pair of tongs lies across a heatproof mat. A stopwatch shows 00:00. A folded worksheet is tucked under the mat.',
    present: ['A beaker filled to 200 ml', 'A stopwatch showing zero', 'Tongs across a heatproof mat'],
    absent: ['A thermometer in a clamp stand', 'A pair of safety goggles', 'A measuring cylinder beside it'],
    note: 'A science bench without goggles is unusual, and unusual is what your memory quietly corrects. Correcting a scene towards what it should contain is how false details get in.',
  },
  {
    study:
      'THE POST OFFICE COUNTER. A set of scales shows 0.4 kg. A roll of brown tape sits beside a stamp block. A queue barrier is pulled halfway across. A poster behind the counter shows last posting dates. A pen is tied to the counter with string.',
    present: ['Scales showing 0.4 kilograms', 'A pen tied on with string', 'A poster of last posting dates'],
    absent: ['A tray of padded envelopes', 'A card machine on the counter', 'A bell for calling the clerk'],
    note: 'The absent three are the furniture of a post office. When a scene has a strong category, recognition starts reporting on the category instead of the scene.',
  },
  {
    study:
      'THE ATTIC. A cardboard box is labelled "winter" in marker. A standing lamp with no shade leans against a beam. A bicycle wheel hangs from a nail. A stack of vinyl records sits on a suitcase. A skylight is propped open with a stick.',
    present: ['A box labelled winter in marker', 'A skylight propped with a stick', 'A bicycle wheel hung on a nail'],
    absent: ['A rolled-up carpet in a corner', 'A cot frame taken apart', 'A trunk with metal corners'],
    note: 'Attics come with a stock inventory, and the three absent items are all on it. Nothing about them contradicts the scene, which is why they are hard rather than obvious.',
  },
  {
    study:
      'THE HAIRDRESSER\'S. Three chairs face a long mirror and the middle one is turned outwards. A trolley holds combs in a jar and two pairs of scissors. A radio on the shelf is playing quietly. An appointment book is open on the desk. A broom leans by the bin.',
    present: ['The middle chair turned outwards', 'An appointment book left open', 'A broom leaning by the bin'],
    absent: ['A row of hairdryers on hooks', 'A sink at the back for washing', 'A price list stuck on the mirror'],
    note: 'A salon that had no sink would be strange, so your memory supplies one. The test is whether you can hold "the scene did not mention it" against "the place would obviously have one".',
  },
  {
    study:
      'THE FISHING PIER. A rod rests in a holder bolted to the rail. A bucket beside it holds a few inches of water. A folded canvas chair leans against a post. A cap is hooked over the rod handle. A coil of line lies at the base of the post.',
    present: ['A bucket with water in it', 'A cap hooked on the rod handle', 'A canvas chair folded up'],
    absent: ['A tackle box with the lid open', 'A net propped against the rail', 'A flask standing on the boards'],
    note: 'Every absent item is standard fishing equipment. Familiarity with a hobby makes this harder, not easier: the better you know the category, the more confidently your memory fills it in.',
  },
  {
    study:
      'THE BAKERY BACK ROOM. A sack of flour stands open with a scoop in it. A metal rack holds four empty trays. A dough hook lies in the sink. A wall timer is counting down from 8 minutes. A chalk note on the wall reads "order 12".',
    present: ['A sack of flour with a scoop', 'A timer counting down from 8', 'A chalk note reading order 12'],
    absent: ['A row of proving baskets', 'A set of scales on the bench', 'An apron hanging on the door'],
    note: 'Scales in a bakery are nearly guaranteed in real life and were absent here. Real-world likelihood is not evidence about this particular scene, though it feels like it.',
  },
  {
    study:
      'THE MUSIC SHOP WINDOW. A guitar hangs on a stand with a price tag facing outwards. A rack holds sheet music with three titles visible. A metronome sits on a shelf, not moving. A card reads "lessons — ask inside". A stool stands empty beside the stand.',
    present: ['A metronome sitting still', 'A card advertising lessons', 'A stool standing empty'],
    absent: ['A drum kit set up behind', 'A wall of guitar picks', 'A poster for a local band'],
    note: 'The three absent items are shop-window furniture in a music shop. Recognition is answering the question "does this fit?" while you believe you are asking "was this there?".',
  },
]

const presentOrPlausible = tpl(
  {
    id: 'odepth-recall-present',
    name: 'What was actually there',
    skillIds: ['o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: PRESENT_SCENES.length,
    minutes: 3,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const s = cycle(seed, PRESENT_SCENES)
    return {
      title: 'Present, or merely plausible?',
      prompt: 'Study the scene. Afterwards you will pick out the details that were genuinely in it, from a list where the others would all have fitted perfectly well.',
      parts: [
        {
          study: `${s.study}\n\nWhile you read, note what is NOT here as well as what is. Expecting an "was this present?" question is itself part of the encoding.`,
          studySeconds: 40,
          prompt: 'Select **every** detail that was actually in the scene. Exactly three of the six were.',
          answer: multi(rng, s.present, s.absent),
          explanation: `The three that were there: ${s.present.map((p) => `**${p}**`).join(', ')}. ${s.note}`,
          hints: [
            'Take each option and try to place it in the scene — not "would it fit?" but "where exactly was it?".',
            'An item you can picture in general but not locate is almost certainly one you supplied.',
            'Exactly three of the six were present, so a fourth tick means one of your first three is wrong.',
          ],
        },
      ],
      hints: [
        'Encode the absences as well as the objects — a scene is defined by both.',
        'Familiarity is not memory: fitting the scene and being in it feel the same.',
        'The three real details are named in the explanation once you have answered.',
      ],
      explanation:
        `Actually present: ${s.present.map((p) => `**${p}**`).join(', ')}.\n\n${s.note}\n\n` +
        'This is the failure mode behind most confidently wrong recollections. A remembered scene is not a recording being replayed; it is rebuilt each time from fragments plus expectations, and the expectations do not arrive labelled. The practical defence is the one used above: ask where exactly a detail sat, because a supplied detail has no position.',
    }
  },
)

/* ==================================================================
 * o-listen — the paraphrase that neither adds nor loses
 * ================================================================== */

interface HedgeCase {
  said: string
  correct: string
  wrong: [text: string, note: string, tag: ErrorTag][]
  why: string
}

/**
 * The hedge is the part of a sentence that survives a listener's good
 * intentions least well. "I think", "probably", "for now", "some of" and
 * "maybe" are the speaker's own uncertainty, deliberately placed; a paraphrase
 * that removes them has not compressed the message, it has strengthened it —
 * and the speaker then has to argue against a position they never held.
 */
const HEDGE_CASES: HedgeCase[] = [
  {
    said: '"I think I might be free on Saturday, but I need to check whether we are visiting my gran."',
    correct: 'Saturday is possible, and the visit decides it',
    wrong: [
      ['You are free on Saturday and can come along', 'The maybe has been resolved into a yes by the listener.', 'inference'],
      ['You cannot make Saturday because of your gran', 'The same maybe resolved the other way, which is no better.', 'inference'],
      ['You would rather see your gran than come out with us', 'A preference invented to explain a scheduling problem.', 'inference'],
    ],
    why: 'Two hedges were used — "think" and "might" — and one named condition. A faithful mirror keeps the condition and leaves the answer open.',
  },
  {
    said: '"Some of the group did not do their part, so we handed in a shorter version than we planned."',
    correct: 'Part of the work was missing, so it went in short',
    wrong: [
      ['Nobody in the group did the work they agreed to', 'Some has been read as everyone, which is a different claim.', 'misread'],
      ['The group handed in work that was not good enough', 'A quality judgement the speaker did not make at all.', 'inference'],
      ['You had to write the whole thing on your own instead', 'A story about who did the work, invented from "some".', 'inference'],
    ],
    why: '"Some" is a quantifier and it is doing real work. Turning it into "nobody" changes both what happened and who is being accused.',
  },
  {
    said: '"The new bus route is usually quicker, though it was slower the two times it rained."',
    correct: 'It is quicker most days, and rain seems to reverse that',
    wrong: [
      ['The new route is quicker than the old one every time', 'The exception the speaker volunteered has been deleted.', 'misread'],
      ['The new route cannot be trusted in any kind of bad weather', 'Two observations turned into a rule about all weather.', 'inference'],
      ['You would rather go back to using the old bus route', 'A conclusion about what to do, from a report about times.', 'inference'],
    ],
    why: 'The speaker gave a general pattern AND the cases where it broke. Both halves are the message; keeping only one of them is not a summary.',
  },
  {
    said: '"I am fairly sure the deadline is the 14th, but I would check the sheet before you rely on it."',
    correct: 'The 14th is your best guess, worth confirming',
    wrong: [
      ['The deadline is the 14th, so plan everything around it', 'Fairly sure has become certain, and the caution is gone.', 'inference'],
      ['You do not actually know when the deadline is at all', 'A stated best guess is not the same as knowing nothing.', 'misread'],
      ['The sheet with the deadlines on it is unreliable', 'The speaker recommended the sheet rather than doubting it.', 'misread'],
    ],
    why: 'Somebody who says "fairly sure, but check" has given you a number and an accuracy. Reporting either without the other loses half of it.',
  },
  {
    said: '"Practice has been going okay. My serve is more consistent, though my backhand still falls apart under pressure."',
    correct: 'The serve has improved and the backhand has not',
    wrong: [
      ['Practice is going really well across the whole game', 'One reported improvement has been spread over everything.', 'inference'],
      ['Your backhand is the reason you keep losing matches', 'A cause of losing that the speaker never mentioned once.', 'inference'],
      ['You are unhappy with the way practice has been going', 'An emotion assigned to somebody who said "okay".', 'inference'],
    ],
    why: 'The sentence contains a specific gain and a specific limit. Mirroring it means keeping the pair, because the pair is the information.',
  },
  {
    said: '"Mostly I like the new timetable. The only bit I would change is the double lesson before lunch."',
    correct: 'It works for you apart from that one double lesson',
    wrong: [
      ['You want the whole timetable changed back again', 'One named complaint expanded to a wholesale objection.', 'inference'],
      ['You are perfectly happy with how the timetable works', 'The one exception the speaker offered has been dropped.', 'misread'],
      ['The double lesson before lunch should be moved later', 'A specific solution invented on the speaker\'s behalf.', 'inference'],
    ],
    why: 'A positive with one named exception is a precise message. Both directions of flattening lose it, and the exception is the part they actually want heard.',
  },
  {
    said: '"He said he would probably come, but he says that most weeks and turns up about half the time."',
    correct: 'He said probably, and probably means about half',
    wrong: [
      ['He is definitely coming because he said he would', 'The probably has been upgraded and the base rate ignored.', 'inference'],
      ['He is unreliable and there is no point asking him', 'A verdict on a person, from a report about attendance.', 'inference'],
      ['He never turns up when he says that he is coming', 'Half the time has become never, which reverses the fact.', 'misread'],
    ],
    why: 'The speaker supplied both a statement and the track record that calibrates it. A mirror that keeps only the statement has thrown away the useful half.',
  },
  {
    said: '"The results looked promising, but we only ran it twice and the second run was messier than the first."',
    correct: 'It looks promising on two runs, one of them messy',
    wrong: [
      ['The experiment worked and the results are reliable', 'Promising has become established, and the caveats are gone.', 'inference'],
      ['The experiment failed because the second run was messy', 'One messy run turned into an overall verdict of failure.', 'inference'],
      ['You need to run the experiment several more times', 'A recommendation the speaker did not make in that sentence.', 'inference'],
    ],
    why: 'Everything the speaker hedged — how many runs, how clean they were — is the reason the word "promising" was chosen instead of "works".',
  },
]

const hedgeUpgrade = tpl(
  {
    id: 'odepth-hedge-upgrade',
    name: 'The paraphrase that keeps the hedge',
    skillIds: ['o-listen'],
    bucket: 'observer',
    difficulty: 3,
    variants: HEDGE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, HEDGE_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Do not upgrade the hedge',
      prompt: `Somebody tells you:\n\n> ${c.said}\n\nWhich reply shows you heard what they actually said?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Find the hedging words first — think, might, probably, usually, some, mostly, fairly. They were chosen on purpose.',
        'Three of the four settle something the speaker deliberately left open, in one direction or the other.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'Removing a hedge feels like helpfulness — you are giving the conversation something firm to stand on. What it actually does is hand the speaker a position they did not take, so their next sentence has to be a correction rather than the thing they were going to say. The test is unchanged: could they answer "yes, exactly" without amending you?',
    }
  },
)

interface SortCase {
  said: string
  statements: { text: string; category: number }[]
  note: string
}

const PARAPHRASE_CATEGORIES = ['Faithful', 'Adds something', 'Loses something']

/**
 * Adding and losing are different failures with different consequences, and a
 * learner who only knows "that paraphrase was wrong" cannot repair either. An
 * addition puts words in the speaker's mouth and produces an argument; an
 * omission drops the qualifier that made the message usable and produces a
 * plan built on a sentence nobody said.
 */
const SORT_CASES: SortCase[] = [
  {
    said: '"I can help with the poster on Sunday afternoon, but I have to be home by six."',
    statements: [
      { text: 'You are free Sunday afternoon until six', category: 0 },
      { text: 'You can do the poster on Sunday afternoon', category: 2 },
      { text: 'You would rather not stay out in the evening', category: 1 },
      { text: 'Sunday afternoon works, with a six o\'clock limit', category: 0 },
      { text: 'You are free all day on Sunday to help out', category: 1 },
      { text: 'You can help with the poster at some point', category: 2 },
    ],
    note: 'The time limit is the operational half of that sentence. Dropping it produces a plan that overruns; adding a reason for it produces a conversation about something else.',
  },
  {
    said: '"I did the reading but I did not really follow the second half of it."',
    statements: [
      { text: 'You read it and lost the thread halfway through', category: 0 },
      { text: 'You read all of it, understanding the first half', category: 0 },
      { text: 'You did not understand the reading at all', category: 1 },
      { text: 'You found the reading too difficult for you', category: 1 },
      { text: 'You have done the reading that was set', category: 2 },
      { text: 'You did not follow part of what you read', category: 2 },
    ],
    note: 'Losing the location of the confusion is what makes help impossible: "I did not follow it" and "I lost it at the second half" call for completely different responses.',
  },
  {
    said: '"The coach put me in goal for the second half and I did fine, but I want to play outfield."',
    statements: [
      { text: 'You played goal, did fine, and prefer outfield', category: 0 },
      { text: 'You did fine in goal but would rather be outfield', category: 0 },
      { text: 'You do not like playing in goal at all', category: 1 },
      { text: 'The coach is playing you out of position on purpose', category: 1 },
      { text: 'You would prefer to be playing outfield', category: 2 },
      { text: 'You went in goal for the second half', category: 2 },
    ],
    note: 'Preferring outfield and disliking goal are not the same claim, and the speaker went out of their way to say the first while denying the second.',
  },
  {
    said: '"I sent the form last week. I have not heard back, though they did say it takes ten days."',
    statements: [
      { text: 'It went last week and ten days have not passed', category: 0 },
      { text: 'You sent it and are inside the stated wait', category: 0 },
      { text: 'You are worried that they have lost your form', category: 1 },
      { text: 'They are slower than they said they would be', category: 1 },
      { text: 'You have not heard anything back from them', category: 2 },
      { text: 'The form was sent off some time last week', category: 2 },
    ],
    note: 'The ten days is what turns silence from a problem into a normal wait. Drop it and the same facts read as bad news.',
  },
  {
    said: '"I would rather not do the presentation, but I will if nobody else will."',
    statements: [
      { text: 'You will do it if nobody else steps forward', category: 0 },
      { text: 'You do not want it, but you would step in', category: 0 },
      { text: 'You are refusing to do the presentation', category: 1 },
      { text: 'You are volunteering to do the presentation', category: 1 },
      { text: 'You would rather somebody else did it', category: 2 },
      { text: 'You are willing to do the presentation', category: 2 },
    ],
    note: 'A conditional yes is one message, and both halves of it are load-bearing. Both flattenings here produce a group decision the speaker did not agree to.',
  },
  {
    said: '"The bike is fine to ride, but the back brake needs doing before anyone takes it far."',
    statements: [
      { text: 'It is rideable now, with the back brake to fix', category: 0 },
      { text: 'Short rides are fine; the back brake needs work', category: 0 },
      { text: 'The bike is not safe to ride anywhere at all', category: 1 },
      { text: 'The bike needs a full service before it is used', category: 1 },
      { text: 'The bike is fine for anybody to ride', category: 2 },
      { text: 'The back brake on the bike needs doing', category: 2 },
    ],
    note: 'The condition and the permission arrived in one sentence and mean nothing apart. Either half alone is a sentence somebody could act on and be wrong.',
  },
  {
    said: '"I have finished the diagrams. The write-up is about half done and I am stuck on the conclusion."',
    statements: [
      { text: 'Diagrams done, write-up half done, conclusion stuck', category: 0 },
      { text: 'You are part-way through, blocked at the end', category: 0 },
      { text: 'You have barely started the assignment yet', category: 1 },
      { text: 'You need somebody to write your conclusion for you', category: 1 },
      { text: 'You have finished all of the diagrams', category: 2 },
      { text: 'You are stuck on the conclusion of it', category: 2 },
    ],
    note: 'Three pieces of status were offered and the useful reply keeps all three. Reporting one of them back is a summary of a third of the message.',
  },
  {
    said: '"I like the club, but the walk home afterwards in winter is what puts me off going."',
    statements: [
      { text: 'You like the club; the winter walk is the obstacle', category: 0 },
      { text: 'The club is fine and the dark walk is the problem', category: 0 },
      { text: 'You have decided to stop going to the club', category: 1 },
      { text: 'You do not enjoy the club as much as you did', category: 1 },
      { text: 'You are put off going to the club sometimes', category: 2 },
      { text: 'You like going to the club on the whole', category: 2 },
    ],
    note: 'A named obstacle is a solvable thing; a vague reluctance is not. This is the single most useful reason to mirror precisely rather than kindly.',
  },
]

const paraphraseSort = tpl(
  {
    id: 'odepth-paraphrase-sort',
    name: 'Adds, loses, or faithful',
    skillIds: ['o-listen'],
    bucket: 'observer',
    difficulty: 3,
    variants: SORT_CASES.length,
    minutes: 3.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, SORT_CASES)
    return {
      title: 'Sort the paraphrases',
      prompt:
        `Somebody says:\n\n> ${c.said}\n\nSort each attempted paraphrase.\n\n` +
        '**Faithful** = the same message, nothing gained or lost. **Adds something** = it asserts more than was said. **Loses something** = everything in it is true, but part of the message is gone.',
      answer: classify(rng, PARAPHRASE_CATEGORIES, c.statements),
      hints: [
        'Check each one twice: once for anything in it that was not in the original, once for anything in the original that is not in it.',
        'The "loses" ones are the harder half, because every word of them is accurate — the fault is what is absent.',
        `Worked path: ${c.statements.map((s) => `"${s.text.slice(0, 30)}…" → ${PARAPHRASE_CATEGORIES[s.category]}`).join('; ')}.`,
      ],
      explanation:
        `${c.statements.map((s) => `**${PARAPHRASE_CATEGORIES[s.category]}**: ${s.text}`).join('. ')}.\n\n${c.note}\n\n` +
        'Two failures, two different repairs. Adding is caught by asking "which word of mine did they say?" — if you cannot point to it, you supplied it. Losing is caught by counting the pieces: a sentence with a condition, a limit or an exception has two or three parts, and a mirror with fewer parts than the original has dropped one.',
    }
  },
)

interface AssertedCase {
  message: string
  asserted: string[]
  supplied: string[]
  note: string
}

/**
 * Selecting rather than judging. Given a message and six readings of it, three
 * are things the speaker put there and three are things a listener commonly
 * brings — and because the listener's additions are always the interesting,
 * actionable ones, they are what the conversation ends up being about.
 */
const ASSERTED_CASES: AssertedCase[] = [
  {
    message: '"I noticed you swapped the running order. Was that because of the timing, or something else?"',
    asserted: [
      'They noticed the running order changed',
      'They are asking what the reason was',
      'They named timing as one possibility',
    ],
    supplied: [
      'They think changing it was a mistake',
      'They want the old running order back',
      'They are annoyed at not being asked',
    ],
    note: 'A question about a reason is a question about a reason. Everything else in the list is a listener\'s guess at what is behind it, and each one would turn a two-line exchange into a defence.',
  },
  {
    message: '"I have not looked at the shared doc since Tuesday, so I do not know where it got to."',
    asserted: [
      'They last opened the document on Tuesday',
      'They do not know its current state',
      'They are telling you their information is stale',
    ],
    supplied: [
      'They are apologising for not keeping up',
      'They expect somebody else to update them',
      'They think the document has been neglected',
    ],
    note: 'A statement about what somebody knows is not a statement about what they feel, want or expect — but a listener supplies all three within about a second.',
  },
  {
    message: '"That is a lot more work than I thought it was. How long did the first section take you?"',
    asserted: [
      'They had underestimated the workload',
      'They are asking about the first section',
      'They want a time, not an opinion',
    ],
    supplied: [
      'They think you spent too long on it',
      'They are hinting they cannot finish theirs',
      'They want you to take some of their part',
    ],
    note: 'Two sentences: a revision of an estimate, and a request for data. The three supplied readings all invent a request that was not made.',
  },
  {
    message: '"I can do Thursday or Friday. Thursday is easier for me but either works."',
    asserted: [
      'Both Thursday and Friday are possible',
      'They find Thursday easier of the two',
      'They have said either one is workable',
    ],
    supplied: [
      'They would be annoyed if you chose Friday',
      'They are really asking you to pick Thursday',
      'Friday would be a serious problem for them',
    ],
    note: 'A stated preference plus an explicit "either works" is unusually clear, and listeners still convert it into a demand. Taking the sentence at face value is the whole skill.',
  },
  {
    message: '"I read your draft. The middle argument is the strongest bit and the opening took me two goes."',
    asserted: [
      'They read the draft you sent',
      'They rate the middle argument highest',
      'They had to read the opening twice',
    ],
    supplied: [
      'They think the opening should be rewritten',
      'They did not like the draft on the whole',
      'They are being polite about a weak piece',
    ],
    note: '"Took me two goes" reports a reader\'s experience, not a verdict, and it is more useful precisely because it is not one. Converting it into a demand for a rewrite throws that away.',
  },
  {
    message: '"We are short two people for Saturday. I have asked the year above and I am waiting to hear."',
    asserted: [
      'Saturday is two people short at the moment',
      'They have already asked the year above',
      'They have not had an answer back yet',
    ],
    supplied: [
      'They are asking you to come on Saturday',
      'They think the year above will say no',
      'They are worried the event will not run',
    ],
    note: 'Nobody was asked for anything in that message. A status update with a gap in it feels like a request because you can see how to fill the gap.',
  },
  {
    message: '"I did not get the part I auditioned for. I am in the chorus and rehearsals start next week."',
    asserted: [
      'They did not get the part they wanted',
      'They have a place in the chorus',
      'Rehearsals begin some time next week',
    ],
    supplied: [
      'They are upset about the casting decision',
      'They want to be talked out of quitting',
      'They think the casting was unfair to them',
    ],
    note: 'Two facts and a date. The listener\'s job here is genuinely hard, because a response is needed and the feeling was not stated — which is an argument for asking rather than assuming.',
  },
  {
    message: '"The camera works but the battery only lasts about forty minutes now."',
    asserted: [
      'The camera itself is working',
      'The battery lasts around forty minutes',
      'That is shorter than it used to be',
    ],
    supplied: [
      'They want you to buy a new battery',
      'The camera is not worth taking anywhere',
      'They are warning you not to borrow it',
    ],
    note: 'The word "now" carries the comparison and nothing else in the sentence carries a request. Reading a specification as advice is how a simple message becomes a disagreement.',
  },
]

const saidVersusHeard = tpl(
  {
    id: 'odepth-said-versus-heard',
    name: 'What was said, and what you brought',
    skillIds: ['o-listen', 'o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: ASSERTED_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ASSERTED_CASES)
    return {
      title: 'Which of these did they actually say?',
      prompt: `You get this message:\n\n> ${c.message}\n\nSelect **every** reading that is genuinely in the message. Exactly three of the six are.`,
      answer: multi(rng, c.asserted, c.supplied),
      hints: [
        'Go word by word: for each reading, find the phrase it comes from. If there is no phrase, it came from you.',
        'The three you should leave are all about what the sender WANTS or FEELS, and none of that was written down.',
        `Worked path: the three that are actually there are "${c.asserted.join('", "')}".`,
      ],
      explanation:
        `In the message: ${c.asserted.map((a) => `**${a}**`).join(', ')}.\n\n${c.note}\n\n` +
        'The additions all share a shape: they convert a report into a request, or a fact into a feeling. That is not stupidity, it is a reasonable default — most messages do carry a want, and guessing it saves time when the guess is right. The cost lands when it is wrong, because you answer the message you invented and the sender has to work out what happened.',
    }
  },
)

const MIRROR_CASES = [
  {
    said: '"I said I would run the stall but I did not know it was the whole afternoon. I can do the first hour."',
    model:
      'You agreed to the stall before you knew how long it ran, and now that you do, the first hour is what you can commit to. So the offer stands but the size of it has changed.',
    good: [
      'They agreed before knowing the length',
      'They can commit to the first hour',
      'The offer stands at a smaller size',
    ],
    weak: [
      'They regret having agreed to it at all',
      'They want somebody else to take over',
      'They are unhappy about being asked',
    ],
  },
  {
    said: '"The tickets are cheaper if we book six together, but I do not want to pay for people who then drop out."',
    model:
      'A group of six brings the price down, and the worry is being left holding the cost if somebody pulls out. So the block booking is attractive and the risk of covering others is the sticking point.',
    good: [
      'Booking six together lowers the price',
      'The worry is covering people who drop out',
      'They have not ruled out booking together',
    ],
    weak: [
      'They think the others are unreliable',
      'They would rather book on their own',
      'They cannot afford the ticket price',
    ],
  },
  {
    said: '"I finished my section on time. I did not check it against yours, so there might be some overlap."',
    model:
      'Their part is done and was delivered on time, and the one thing they did not do is compare it with yours, so overlap is possible rather than known. The message is a status report with a flagged risk.',
    good: [
      'Their section was finished on time',
      'They did not compare it with yours',
      'Overlap is possible and not confirmed',
    ],
    weak: [
      'They think you should check for overlap',
      'They believe their section is the better one',
      'They are apologising for rushing the work',
    ],
  },
  {
    said: '"I do want to come to the thing on Friday. I am just not sure I will have the energy after the trip."',
    model:
      'The wish to come is genuine and the doubt is about energy after travelling, not about the event. So the answer is a real maybe, and the deciding factor is how the trip leaves them.',
    good: [
      'They genuinely want to come on Friday',
      'The doubt is about energy after the trip',
      'The answer is open rather than a refusal',
    ],
    weak: [
      'They are making an excuse to get out of it',
      'They would come if it were on another day',
      'They do not enjoy that kind of event',
    ],
  },
  {
    said: '"I told the group I would edit the video. Nobody has sent me their clips, so I have not started."',
    model:
      'They took on the editing and cannot begin until clips arrive, and none have. The blockage is upstream of them, and the message is reporting that rather than asking anyone in particular for anything.',
    good: [
      'They took on editing the video',
      'No clips have reached them yet',
      'The hold-up is before their part',
    ],
    weak: [
      'They are blaming the group for the delay',
      'They want you to chase everybody up',
      'They no longer want to do the editing',
    ],
  },
  {
    said: '"Your idea for the ending is better than mine. I still like my opening though, if we can use both."',
    model:
      'They are conceding the ending to you and holding onto their opening, and they have proposed combining the two. That is an agreement with a condition attached, not a full agreement and not a fight.',
    good: [
      'They prefer your ending to their own',
      'They still want to keep their opening',
      'They have suggested using both parts',
    ],
    weak: [
      'They are giving in to keep the peace',
      'They think their opening is the better half',
      'They expect you to drop your own opening',
    ],
  },
]

const mirrorThenCheck = tpl(
  {
    id: 'odepth-mirror-then-check',
    name: 'Write the mirror, then check it',
    skillIds: ['o-listen'],
    bucket: 'observer',
    difficulty: 4,
    variants: MIRROR_CASES.length,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, MIRROR_CASES)
    return {
      title: 'Mirror it in your own words',
      prompt: `Somebody says:\n\n> ${c.said}`,
      parts: [
        {
          stage: 'Mirror',
          prompt:
            'Write the paraphrase you would actually say back. Do it from your own head first — the model appears once you have written something.',
          answer: draft({
            criteria: [
              'Every part of what they said is represented, including any condition or limit',
              'Nothing about their feelings, motives or wishes that they did not state',
              'No verdict on whether they are right, fair or reasonable',
              'Short enough that they could answer "yes, exactly" in one word',
            ],
            model: c.model,
            minWords: 20,
            placeholder: 'So what you are saying is… and the part that matters to you is…',
          }),
          explanation:
            'Writing the mirror before seeing any options is the exercise, because recognising a good paraphrase is much easier than producing one. Nothing here is scored — the graded check is next.',
        },
        {
          stage: 'Check',
          prompt: `Now the graded part. Select **every** statement below that is genuinely contained in what they said. Exactly three of the six are.`,
          answer: multi(rng, c.good, c.weak),
          explanation:
            `In the message: ${c.good.map((g) => `**${g}**`).join(', ')}.\n\n` +
            'The three to leave are the ones that assign a motive, a mood or a demand. Compare them against your own draft above — the useful question is not whether your version was good, but whether it contained anything from the right-hand column.',
          hints: [
            'For each statement, find the words in the original that produce it.',
            'Anything describing what they secretly want, or how they feel about it, was supplied by the reader.',
            'Exactly three of the six belong to the speaker.',
          ],
        },
      ],
      hints: [
        'A mirror has to carry the conditions and the exceptions, not only the headline.',
        'Write it as a sentence you would really say, then check it for smuggled motive.',
        'The selection at the end is what is graded; the writing is for you.',
      ],
      explanation:
        `Model mirror: ${c.model}\n\nThe habit being built is small: before responding, say the message back in a form the speaker could confirm in one word. It costs a sentence and it catches the two failures that make conversations go wrong — the condition you dropped, and the motive you added.`,
    }
  },
)

/* ==================================================================
 * o-bias — defence against readings, and calibration as arithmetic
 * ================================================================== */

interface FitsCase {
  setting: string
  universal: string[]
  specific: string[]
  note: string
}

/**
 * DEFENCE ONLY. This teaches recognition of lines that fit nearly everyone and
 * the one question that exposes them ("what share of people would nod?"). It
 * contains no instruction in composing such lines and no profiling of anyone.
 * Half of each set is genuinely checkable, so "this one really does say
 * something" stays a live answer and the family cannot be beaten by blanket
 * suspicion.
 */
const FITS_CASES: FitsCase[] = [
  {
    setting: 'A "personality reading" printed by a website after you answer four questions',
    universal: [
      'You have a side of yourself that few people see',
      'You worry more about some decisions than you let on',
      'You value honesty but pick your moments to use it',
    ],
    specific: [
      'You have kept the same phone for over three years',
      'You play a team sport at least once a week',
      'You have an older sibling living in the same house',
    ],
    note: 'The three universal lines cannot come out false about anybody, so agreeing with them is not information about you. The other three could each be wrong about you this minute.',
  },
  {
    setting: 'A "reading" given at a school fair by somebody at a table with a cloth over it',
    universal: [
      'Something you were counting on recently did not happen',
      'You are harder on yourself than other people are on you',
      'There is a decision you keep putting off making',
    ],
    specific: [
      'You have broken a bone at some point in your life',
      'You walked here rather than being driven',
      'You are wearing something borrowed from a family member',
    ],
    note: 'Disappointment, self-criticism and a postponed decision are close to universal in any room. The specific three each split the room roughly in half.',
  },
  {
    setting: 'A horoscope column in a free magazine',
    universal: [
      'A conversation this week will take an unexpected turn',
      'You will need to balance what you want against what is expected',
      'An old idea of yours is worth another look',
    ],
    specific: [
      'You will travel more than fifty miles this week',
      'You will spend money on something for somebody else',
      'You will start a book you do not finish',
    ],
    note: 'The first three are written so that any week supplies a match. The second three could each be checked on Sunday and found wrong.',
  },
  {
    setting: 'An online quiz claiming to work out your "hidden strength"',
    universal: [
      'You notice things about people that others miss',
      'You need time on your own to recharge properly',
      'You have more ambition than you usually show',
    ],
    specific: [
      'You can name every capital city in Europe',
      'You have run more than five kilometres this month',
      'You cook a meal from scratch most weeks',
    ],
    note: 'Every one of the first three is a compliment that also sounds like an insight, which is the combination that makes people rate a reading as accurate.',
  },
  {
    setting: 'A "handwriting analysis" printed on a card at a market stall',
    universal: [
      'You are careful about who you fully trust',
      'You have talents you have not really used yet',
      'You tend to think about a reply before giving it',
    ],
    specific: [
      'You write with your left hand rather than your right',
      'You use a fountain pen for most of your writing',
      'You keep a paper diary as well as a phone calendar',
    ],
    note: 'Handwriting is where the specific claims would have to come from, and none of the universal three is about handwriting at all — a detail that is easy to miss while nodding.',
  },
  {
    setting: 'A sales pitch that opens by "reading" you before mentioning the product',
    universal: [
      'You do your research before spending real money',
      'You have been let down by something you bought before',
      'You would rather pay once for something decent',
    ],
    specific: [
      'You bought something from this shop last month',
      'You are shopping for somebody else today',
      'You have a budget in mind under a hundred pounds',
    ],
    note: 'Flattery about being careful with money is agreed to by almost everybody, including people who are not. Notice that agreeing also commits you to the pitch that follows.',
  },
  {
    setting: 'A social media post listing "signs you are an overthinker"',
    universal: [
      'You replay conversations afterwards in your head',
      'You sometimes take a while to fall asleep',
      'You notice when somebody\'s tone changes',
    ],
    specific: [
      'You keep a written list of things to worry about',
      'You have missed a deadline in the last month',
      'You check your phone before getting out of bed',
    ],
    note: 'Lists of "signs" work by choosing experiences nearly everyone has and framing them as a category. The recognition is real; the diagnosis is not.',
  },
  {
    setting: 'A team-building sheet that assigns everybody a "type"',
    universal: [
      'You work best when you understand the reason for a task',
      'You can lead when you need to, though you do not seek it',
      'You get frustrated by meetings that go nowhere',
    ],
    specific: [
      'You take written notes in every meeting you attend',
      'You have run a session for the group yourself',
      'You joined this team in the last six months',
    ],
    note: 'A description that everyone in the room accepts cannot be sorting anyone into types, which is worth knowing before the sheet gets used to assign roles.',
  },
]

const fitsEveryone = tpl(
  {
    id: 'odepth-fits-everyone',
    name: 'Which lines fit everybody?',
    skillIds: ['o-bias'],
    bucket: 'observer',
    difficulty: 2,
    variants: FITS_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FITS_CASES)
    return {
      title: 'Who could say no to this?',
      prompt:
        `${c.setting}. Six lines come out.\n\nSelect **every** line that nearly anybody would accept as accurate about themselves.\n\nExactly three of the six are like that; the other three could genuinely be wrong about you.`,
      answer: multi(rng, c.universal, c.specific),
      hints: [
        'For each line, picture thirty people in a room and ask how many would have to say "no, not me".',
        'A line that nobody has to reject has ruled nothing out, however precisely it seems to describe you.',
        `Worked path: the three that fit almost everyone are "${c.universal.join('", "')}".`,
      ],
      explanation:
        `Fits nearly anybody: ${c.universal.map((u) => `**${u}**`).join(', ')}.\n\n${c.note}\n\n` +
        'The defence is a single question, and it is the same one every time: what share of all people would accept this? It works on horoscopes, personality quizzes, "signs you are…" lists, and any sales conversation that opens by describing you. The mirror-image error matters too — if you decide every statement about you is empty flattery, you lose the ability to notice the checkable ones, and the checkable ones are the only ones worth arguing about.',
    }
  },
)

interface SuppliedCase {
  told: string
  said: string
  correct: string
  wrong: [text: string, note: string, tag: ErrorTag][]
  why: string
}

/**
 * The defensive habit is bookkeeping: track who introduced each fact. This
 * family puts the learner on the receiving end and asks them to find the line
 * that came back out of their own mouth. It describes what happened to them; it
 * teaches no technique for use on anybody else.
 */
const SUPPLIED_CASES: SuppliedCase[] = [
  {
    told: 'Waiting your turn, you mention that you have been up late revising and that your bag is heavy with library books.',
    said: '"I am picking up that you have been carrying a heavy load lately — and that rest has not come easily."',
    correct: 'Your own two remarks, restated as one image',
    wrong: [
      ['A genuine observation of how tired you look', 'Tiredness is visible, but the SPECIFICS came from you.', 'inference'],
      ['A lucky guess that happened to land well', 'No luck is needed when the facts were supplied first.', 'inference'],
      ['A claim that could easily have been wrong', 'It could not: it repeats what you said a minute ago.', 'concept'],
    ],
    why: 'Late nights and a heavy bag went in; "a heavy load" and "rest has not come easily" came back out. The image is new and the content is yours.',
  },
  {
    told: 'You say you moved house last summer and that you are still getting used to the new bus route.',
    said: '"There has been an upheaval in your recent past that you have not fully settled into yet."',
    correct: 'A general version of what you just told them',
    wrong: [
      ['A statement that fits almost anybody at all', 'It would, but the reason it fits YOU is that you said it.', 'inference'],
      ['An insight into how you feel about the move', 'No feeling was mentioned by either of you.', 'inference'],
      ['A prediction about how you will settle in there', 'Nothing here is about the future at all.', 'misread'],
    ],
    why: 'A move and an unfamiliar route become "upheaval" and "not fully settled". The abstraction hides the source, which is what makes it feel like a reading.',
  },
  {
    told: 'You mention that you are choosing subjects for next year and that your family thinks you should take chemistry.',
    said: '"I sense a choice ahead of you, with someone close pulling you in a particular direction."',
    correct: 'Both facts you gave, in vaguer language',
    wrong: [
      ['A claim about your family that goes further', 'It does not go further; it goes blurrier.', 'inference'],
      ['A statement true of most people your age', 'True enough, and still not where this one came from.', 'inference'],
      ['A guess that could have missed completely', 'It had no way to miss — you had already said it.', 'concept'],
    ],
    why: 'The reader has swapped concrete words for abstract ones. That is the whole move, and abstraction is what makes a repetition sound like knowledge.',
  },
  {
    told: 'You say you have been running before school and that you are training for something in the spring.',
    said: '"You have been putting effort into something that will not pay off for a while yet."',
    correct: 'A restatement of the training you described',
    wrong: [
      ['An observation about your general character', 'Character was never mentioned by anybody here.', 'inference'],
      ['A comment about how patient a person you are', 'That is a compliment attached to your own fact.', 'inference'],
      ['A claim you could check and find false', 'Checking it would only return what you said.', 'concept'],
    ],
    why: 'Spring training is effort with a delayed payoff by definition. The sentence contains no fact that did not arrive with you.',
  },
  {
    told: 'You mention that your phone screen is cracked and that you have been putting off getting it fixed.',
    said: '"Something small has been nagging at you, and you keep pushing it down the list."',
    correct: 'Your own delay, described without the phone',
    wrong: [
      ['A general truth about how people behave', 'It is that as well, and it is still your sentence.', 'inference'],
      ['A claim about what you find important', 'No importance ranking was stated by you at all.', 'inference'],
      ['An observation of something they actually noticed', 'They noticed you saying it, which is not the same.', 'concept'],
    ],
    why: 'Removing the noun is the trick to spot: "the phone" becomes "something small", and the sentence now sounds like it could be about anything, including things they could not know.',
  },
  {
    told: 'You say you have two younger cousins staying this week and that the house has been noisy.',
    said: '"Your home life feels busier than usual at the moment, and it is not entirely your choosing."',
    correct: 'Your visitors and the noise, put generally',
    wrong: [
      ['An accurate read of your mood this week', 'Mood was not mentioned by either of you.', 'inference'],
      ['A statement that most people would agree with', 'Most would, and yours came from your own report.', 'inference'],
      ['A guess about your family arrangements', 'You described the arrangements yourself, first.', 'concept'],
    ],
    why: 'Cousins staying plus noise equals a busier house. The only addition is "not entirely your choosing", which is the kind of safe extra that any visitor situation supports.',
  },
  {
    told: 'You mention that you dropped out of the choir last term and that you might go back after the concert.',
    said: '"You stepped away from something that mattered, and part of you has not closed the door on it."',
    correct: 'Leaving and maybe returning, said warmly',
    wrong: [
      ['An insight about what the choir meant to you', 'Meaning was assumed; you only said you left it.', 'inference'],
      ['A prediction that you will rejoin the choir', 'It carefully avoids predicting anything at all.', 'misread'],
      ['A claim that would be wrong if you did not', 'It is written so that either outcome confirms it.', 'concept'],
    ],
    why: 'You supplied both the leaving and the maybe. What was added is warmth and the words "mattered" and "part of you" — neither of which can be checked.',
  },
  {
    told: 'You say you have been saving for a bike and that you keep changing your mind about which one.',
    said: '"There is a purchase on your horizon, and the deciding is proving harder than the saving."',
    correct: 'Your saving and your indecision, reworded',
    wrong: [
      ['A judgement about how careful you are', 'A flattering extra, added to your own facts.', 'inference'],
      ['A guess about how much you have saved', 'No amount appears anywhere in the sentence.', 'misread'],
      ['A statement that many people would accept', 'Many would, and the fit here has a simpler cause.', 'inference'],
    ],
    why: 'Both halves were handed over in your first sentence. When a "reading" is this accurate, the first thing to check is not how they did it but what you said.',
  },
]

const whoSuppliedIt = tpl(
  {
    id: 'odepth-who-supplied-it',
    name: 'Who put that fact in the room?',
    skillIds: ['o-bias'],
    bucket: 'observer',
    difficulty: 3,
    variants: SUPPLIED_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, SUPPLIED_CASES)
    const { answer, distractorNotes, distractorTags } = mcqNoted(rng, c.correct, c.wrong)
    return {
      title: 'Track the source of each fact',
      prompt: `${c.told}\n\nA short while later, the person doing "readings" says:\n\n> ${c.said}\n\nWhat is that sentence actually made of?`,
      answer,
      distractorNotes,
      distractorTags,
      hints: [
        'Go through their sentence phrase by phrase and mark each part with who introduced it.',
        'Watch for concrete words being swapped for abstract ones — that swap is what disguises a repetition.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'This is a defensive skill and the defence is bookkeeping, not cleverness: keep a running note of which facts YOU introduced. Almost every reading that feels uncanny turns out, on that accounting, to contain nothing that did not walk in with you — and the same test works on a sales conversation that opens by describing your situation back to you.',
    }
  },
)

interface CheckableCase {
  result: string
  correct: string
  wrong: string[]
  why: string
}

/**
 * The repair rather than the diagnosis. Naming a Barnum statement is the easy
 * half; the useful half is knowing what would settle it, and every distractor
 * here is a genuine investigation that cannot settle anything.
 */
const CHECKABLE_CASES: CheckableCase[] = [
  {
    result: 'A quiz tells you your "learner profile" is Reflective Analyst, and the description feels startlingly accurate.',
    correct: 'Read the other three profiles it could have given',
    wrong: [
      'Retake the quiz and see whether it agrees with itself',
      'Ask a friend whether the description sounds like you',
      'Check how many people have taken the quiz',
    ],
    why: 'If the other profiles also describe you, the quiz did not sort you into anything. That comparison is the only one that can come out badly for the quiz.',
  },
  {
    result: 'A star-sign column describes your week and three of the four sentences land.',
    correct: 'Read the other eleven signs for the same week',
    wrong: [
      'Keep the column and check it again on Sunday night',
      'Count how many sentences were right',
      'Look up whether the writer is generally accurate',
    ],
    why: 'A prediction that fits your week is only impressive if the other eleven do not. Counting hits within your own column cannot separate accuracy from generality.',
  },
  {
    result: 'A "handwriting reading" says you are ambitious but self-critical, and you recognise yourself immediately.',
    correct: 'Give them a sample written by somebody else',
    wrong: [
      'Ask them to explain which letters showed the ambition',
      'Write a second sample and see whether it matches',
      'Find out how long they have done this',
    ],
    why: 'Swapping the input while keeping everything else is the one move that could produce a wrong reading. An explanation of the method cannot fail.',
  },
  {
    result: 'A wellbeing app "detects your mood" from four sliders and describes you convincingly.',
    correct: 'Enter the opposite answers and read the result',
    wrong: [
      'Use the app daily for a fortnight',
      'Check whether the description matches how you feel',
      'Read the reviews other people have left for the app',
    ],
    why: 'If opposite inputs produce a description you also recognise, the sliders are decorative. Repeating the same inputs cannot reveal that.',
  },
  {
    result: 'A careers questionnaire says you are suited to "roles involving people and problem-solving".',
    correct: 'Find a real job that the phrase rules out',
    wrong: [
      'Ask the careers teacher whether the result fits you',
      'Take it again in a different mood',
      'Look at what your friends got from the same questions',
    ],
    why: 'A description that excludes nothing has recommended nothing. Hunting for what it forbids is how you find out whether it said anything at all.',
  },
  {
    result: 'A "reading" at a stall tells you something about your family that turns out to be true.',
    correct: 'Work out whether you mentioned it first',
    wrong: [
      'Ask them for a detail they could not possibly know',
      'Go back next week and see if they remember you',
      'Ask how they knew that detail',
    ],
    why: 'Nearly every hit of this kind traces back to something the visitor supplied. Asking for a new detail invites another safe guess rather than settling the old one.',
  },
  {
    result: 'A personality video says you are "the type who notices what everybody else misses".',
    correct: 'Ask what the opposite type would look like',
    wrong: [
      'Watch the rest of the series and see if it fits',
      'Check the comments for people who disagree with it',
      'Ask what research the video used',
    ],
    why: 'If nobody would accept the opposite description, the flattering one is not a category. Comments and further videos both sample people who already like it.',
  },
  {
    result: 'A "compatibility" result says you and a friend match because you are both "loyal but independent".',
    correct: 'Test the phrase against two people who clash',
    wrong: [
      'Ask your friend if it fits them too',
      'Try it with a third friend and compare the results',
      'Check what the site says about mismatched pairs',
    ],
    why: 'A phrase that also fits two people who cannot stand each other explains no match. Asking your friend collects another agreement, and agreements are what a Barnum line is designed to collect.',
  },
]

const makeItCheckable = tpl(
  {
    id: 'odepth-make-it-checkable',
    name: 'What would settle it?',
    skillIds: ['o-bias', 'o-expect'],
    bucket: 'observer',
    difficulty: 3,
    variants: CHECKABLE_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, CHECKABLE_CASES)
    return {
      title: 'The check that could embarrass it',
      prompt: `${c.result}\n\nWhich check would tell you whether it is about you specifically, rather than about everybody?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask, for each option, what result would make you believe LESS. If there is not one, it is not a check.',
        'The move that works is nearly always to change the input and see whether the output follows.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The three that do not work all gather more information, which is why they feel like scepticism. Repeating the same input, asking the source to explain itself, and collecting other people\'s agreement each return the same answer whether the thing is genuine or not. A check earns its name only when a result exists that would have made you drop the belief.',
    }
  },
)

const CALIBRATION_CONTEXTS = [
  { what: 'a set of practice questions', unitPlural: 'questions' },
  { what: 'a round of vocabulary recall', unitPlural: 'words' },
  { what: 'a batch of true-or-false claims', unitPlural: 'claims' },
]
const CALIBRATION_N = [10, 20]
const CALIBRATION_C = [60, 70, 80]
const CALIBRATION_KINDS = ['over', 'level', 'under'] as const

const CALIBRATION_KEYS = {
  over: 'Your confidence sits above your actual accuracy',
  level: 'Nothing is wrong — the two figures line up',
  under: 'Your accuracy is better than you were claiming',
}
const CALIBRATION_POOL = [
  'The questions were harder than they first appeared',
  'A run this short cannot really show anything at all',
  'Confidence and accuracy are unconnected quantities',
  'The figures would settle down over many more attempts',
]

/**
 * Calibration taught as arithmetic rather than as vocabulary. A stated
 * confidence is a PREDICTION — "70% sure" on twenty questions predicts fourteen
 * — and the gap between that prediction and the outcome is a subtraction anyone
 * can do. One variant in three is deliberately well calibrated, so the item
 * cannot be beaten by always answering "overconfident".
 *
 * Honesty note carried in the copy: this measures a gap on one short run. It
 * makes no claim that doing the arithmetic improves calibration in general.
 */
const calibrationGap = tpl(
  {
    id: 'odepth-calibration-gap',
    name: 'What your confidence predicted',
    skillIds: ['o-bias', 'm-percent'],
    bucket: 'observer',
    difficulty: 2,
    variants: CALIBRATION_N.length * CALIBRATION_C.length * CALIBRATION_KINDS.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = CALIBRATION_CONTEXTS[seed % CALIBRATION_CONTEXTS.length]
    const n = CALIBRATION_N[seed % CALIBRATION_N.length]
    const c = CALIBRATION_C[Math.floor(seed / CALIBRATION_N.length) % CALIBRATION_C.length]
    const kind = CALIBRATION_KINDS[Math.floor(seed / (CALIBRATION_N.length * CALIBRATION_C.length)) % CALIBRATION_KINDS.length]
    const predicted = (n * c) / 100
    const step = n / 5
    const actual = kind === 'over' ? predicted - step : kind === 'under' ? predicted + step : predicted
    const gap = actual - predicted
    const key = CALIBRATION_KEYS[kind]
    const others = (Object.keys(CALIBRATION_KEYS) as (keyof typeof CALIBRATION_KEYS)[])
      .filter((k) => k !== kind)
      .map((k) => CALIBRATION_KEYS[k])
    return {
      title: 'Confidence is a prediction',
      prompt:
        `You work through ${ctx.what}: ${n} of them. On every one you say you are **${c}% sure** before checking.\n\n` +
        `When you mark them, **${actual}** are right.`,
      parts: [
        {
          prompt: `If ${c}% sure is an honest figure, how many of the ${n} ${ctx.unitPlural} should you have got right?`,
          answer: numeric(predicted, { unit: ctx.unitPlural }),
          explanation: `${c}% of ${n} is **${predicted}**. That is what the confidence claim actually predicts — a stated confidence is not a mood, it is a number of expected hits.`,
          hints: [
            'A percentage of a count is that percentage times the count.',
            `Take ${c}% of ${n}.`,
            `Worked path: ${n} × ${c} ÷ 100 = ${predicted}.`,
          ],
        },
        {
          prompt: `How far off was that prediction? Give actual minus predicted — a negative number if you got fewer right than you predicted.`,
          answer: numeric(gap, { unit: ctx.unitPlural }),
          explanation:
            `${actual} − ${predicted} = **${gap}**. ` +
            (gap === 0
              ? 'A gap of zero on this run is what a well-aimed confidence looks like.'
              : gap < 0
                ? 'A negative gap means the confidence promised more than the answers delivered.'
                : 'A positive gap means the answers did better than the confidence claimed they would.'),
          hints: [
            'Subtract the predicted number from the number you actually got right.',
            'The order matters here: actual first, predicted second.',
            `Worked path: ${actual} − ${predicted} = ${gap}.`,
          ],
        },
        {
          prompt: 'What does that gap say about the confidence you were stating?',
          answer: mcq(rng, key, [...others, ...rotateDecoys(seed, CALIBRATION_POOL).slice(0, 1)]),
          explanation:
            `**${key}.**\n\n` +
            (kind === 'level'
              ? 'This is the case worth noticing, because it is the one people skip: the prediction and the result matched, and there is nothing to correct. A family where the answer is always "overconfident" would teach you to say it without looking.'
              : kind === 'over'
                ? 'Stating a confidence higher than your hit rate is the common direction, and the repair is specific: lower the number you say, not the effort you make. Being 60% sure and right 60% of the time is a better state than being 90% sure and right 60% of the time, even though the answers are identical.'
                : 'Understating is the rarer direction and it has a real cost too — a low stated confidence on answers you actually have means you check things you did not need to check, and let other people overrule you when you were right.') +
            '\n\nOne honest limit: this is one short run, and a gap of a few either way is exactly what chance produces. What the arithmetic gives you is a habit of turning a feeling into a number that can be checked, not a verdict from a single session.',
          hints: [
            'Compare the two numbers rather than judging how the session felt.',
            'A gap near zero means there is nothing to correct, which is a real possibility here.',
            `Worked path: predicted ${predicted}, actual ${actual}.`,
          ],
        },
      ],
      hints: [
        'Turn the percentage into a predicted count first — that is the whole idea.',
        'Then subtract, keeping the sign.',
        'The last part reads the sign of the gap, and zero is one of the possible answers.',
      ],
      explanation:
        `A confidence of ${c}% across ${n} ${ctx.unitPlural} predicts ${predicted} correct. You got ${actual}, a gap of ${gap}.\n\n` +
        'The reason to do this arithmetic at all is that confidence is normally stored as a feeling, and feelings cannot be checked against anything. Written as a number it becomes a prediction, and a prediction can be wrong in a direction you can see. Note what is NOT claimed here: one run of this exercise measures one run. Whether the habit improves your confidence judgements over months is a separate question this item does not answer.',
    }
  },
)

/* ==================================================================
 * o-memory — encode on purpose, then recall after interference
 * ================================================================== */

/**
 * Every family in this group puts a graded question BETWEEN study and recall.
 * Without that gap an item measures what is still echoing in working memory,
 * which is not what a mnemonic is for and not what the learner wants to know.
 * The interference questions are on-topic (they are about encoding) so the time
 * is not wasted, and they use the same verbal channel the list occupies.
 */
const LOCI_LISTS = [
  { theme: 'a shopping run', items: ['lantern', 'peaches', 'stapler', 'kettle', 'gloves', 'mirror'] },
  { theme: 'a stage set', items: ['anchor', 'trumpet', 'ladder', 'goldfish', 'crown', 'shovel'] },
  { theme: 'a science trip', items: ['magnet', 'seashell', 'compass', 'balloon', 'fossil', 'ruler'] },
  { theme: 'a camping list', items: ['pillow', 'torch', 'whistle', 'apples', 'rope', 'skillet'] },
  { theme: 'a museum tour', items: ['helmet', 'violin', 'telescope', 'basket', 'candle', 'spear'] },
  { theme: 'a garden job', items: ['trowel', 'netting', 'bucket', 'seeds', 'twine', 'wheelbarrow'] },
  { theme: 'a hotel errand', items: ['suitcase', 'umbrella', 'postcard', 'slippers', 'teapot', 'map'] },
  { theme: 'a workshop haul', items: ['clamp', 'sandpaper', 'chisel', 'varnish', 'pencil', 'hinge'] },
]

const IMAGE_QUESTIONS = [
  {
    prompt: 'Which image is more likely to survive the next few minutes at a location on your route?',
    correct: 'A kettle whistling on the doormat, steam everywhere',
    wrong: [
      'A kettle sitting quietly on the doormat',
      'A kettle placed neatly beside the front door of the house',
      'A kettle in its usual place in a kitchen somewhere else',
    ],
    why: 'Images that move, collide with the location, or are absurd are recalled better than images that merely sit there. A kettle in a kitchen has no location cue at all, because the kitchen is where kettles already are.',
  },
  {
    prompt: 'Which of these is the better way to attach an item to its location?',
    correct: 'Have the item doing something to the place itself',
    wrong: [
      'Put the item down in the middle of the place',
      'Picture the item and the place one after the other in turn',
      'Repeat the name of the item and the place to yourself twice',
    ],
    why: 'Interaction is what makes the location act as a cue: walking into the room has to force the image on you. Two pictures side by side are two things to remember rather than one.',
  },
  {
    prompt: 'You reach a location on your route and it is empty. What does that usually mean?',
    correct: 'The image there was too ordinary to stick',
    wrong: [
      'The route was not familiar enough',
      'Six items is more than a route of that length can hold',
      'The order of the list was the part that failed you',
    ],
    why: 'A blank location almost always means a bland image rather than a bad route. The repair is to make that one image louder, not to abandon the method.',
  },
  {
    prompt: 'Why does walking the route in the SAME direction each time matter?',
    correct: 'The order comes from the route, not the list',
    wrong: [
      'It stops you missing a location',
      'It makes each of the images easier to picture clearly',
      'It keeps the total number of locations under control',
    ],
    why: 'The whole reason this method preserves ORDER is that a route has a direction and a list does not. Reversing halfway loses exactly the thing the route was doing for you.',
  },
]

const lociDelayed = tpl(
  {
    id: 'odepth-loci-delayed',
    name: 'Method of loci, recalled after a gap',
    skillIds: ['o-memory'],
    bucket: 'observer',
    difficulty: 3,
    variants: LOCI_LISTS.length,
    minutes: 6,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const list = cycle(seed, LOCI_LISTS)
    const q = IMAGE_QUESTIONS[seed % IMAGE_QUESTIONS.length]
    const display = scrambledDisplay(list.items)
    const correct = list.items.map((it) => display.indexOf(it))
    return {
      title: 'Place six things, answer something else, then walk back',
      prompt:
        'The method of loci stores a list along a route you already know — your own front door, hall, kitchen, stairs, and so on. ' +
        'You will place six objects, then answer a question about something else, and only then rebuild the list.',
      parts: [
        {
          study:
            `Place these six objects for ${list.theme} along YOUR route, one per location, **in this order**:\n\n` +
            `**${list.items.join(' → ')}**\n\n` +
            'Make each object DO something to its location — blocking it, filling it, knocking it over, far too large for it. Walk the route once forwards before you finish.',
          studySeconds: 60,
          prompt: `Before the recall, one question about the technique itself.\n\n${q.prompt}`,
          answer: mcq(rng, q.correct, q.wrong),
          explanation: `**${q.correct}.** ${q.why}`,
          hints: [
            'Ask which version you would be unable to ignore on walking into the room.',
            'A picture that could have been there anyway is not carrying any information about your list.',
            `Worked path: **${q.correct}**.`,
          ],
        },
        {
          prompt: 'Now walk your route from the start and rebuild the list in its original order.',
          answer: { type: 'order', options: display, correct },
          explanation:
            `The original order was: ${list.items.join(' → ')}.\n\n` +
            'If a location came back empty, that image was too polite. If two objects came back in the wrong order, the route was walked from a different starting point — the sequence lives in the route, so the route has to start in the same place every time.',
          hints: [
            'Start at the first location and move through them in order rather than hunting for objects.',
            'An object you cannot find is at a location you have skipped; go back and stand in each room.',
            'The order is given in the explanation once you have answered.',
          ],
        },
      ],
      hints: [
        'One object per location, always walking the route the same way.',
        'Interaction beats decoration: the object should be doing something to the place.',
        'The middle question is there to put a gap between studying and recalling — that gap is the point.',
      ],
      explanation:
        `The list was: ${list.items.join(' → ')}.\n\n` +
        'What the evidence supports, precisely: training in this method produces real and lasting gains in recalling word lists in order — Dresler and colleagues (2017) trained people with no mnemonic background for six weeks and the advantage was still there four months later. What it does not support is any claim about general ability. This is a specific skill for holding ordered material, which is genuinely useful for a shopping list, a running order, a set of steps, or the structure of an argument you have to deliver without notes.\n\nThe gap before recall is deliberate. A list repeated back immediately is still sitting in working memory and tells you nothing about whether the encoding worked.',
    }
  },
)

const CHUNK_CASES = [
  { setting: 'a locker', digits: '4 7 1 9 2 6', letters: 'BLQ', chunkHint: 'Two three-digit chunks, said as two numbers: four-seven-one, nine-two-six.' },
  { setting: 'a bike lock', digits: '8 3 5 2 0 4', letters: 'RTN', chunkHint: 'Two three-digit chunks: eight-three-five, two-zero-four.' },
  { setting: 'a store cupboard', digits: '6 1 4 7 3 9', letters: 'KMP', chunkHint: 'Two three-digit chunks: six-one-four, seven-three-nine.' },
  { setting: 'a gate keypad', digits: '2 9 0 5 8 1', letters: 'DVS', chunkHint: 'Two three-digit chunks: two-nine-zero, five-eight-one.' },
  { setting: 'a stockroom door', digits: '7 2 6 3 1 5', letters: 'FHW', chunkHint: 'Two three-digit chunks: seven-two-six, three-one-five.' },
  { setting: 'a lab freezer', digits: '5 8 2 1 6 0', letters: 'GJX', chunkHint: 'Two three-digit chunks: five-eight-two, one-six-zero.' },
  { setting: 'a bag padlock', digits: '9 4 3 6 0 7', letters: 'CZY', chunkHint: 'Two three-digit chunks: nine-four-three, six-zero-seven.' },
  { setting: 'a tool cage', digits: '1 6 8 4 5 2', letters: 'NPT', chunkHint: 'Two three-digit chunks: one-six-eight, four-five-two.' },
]

/** Digit-swap decoys: the exact way a remembered number falls apart. */
function digitDecoys(digits: string): string[] {
  const d = digits.split(' ')
  const swapAB = [d[1], d[0], d[2], d[3], d[4], d[5]]
  const swapMid = [d[0], d[1], d[3], d[2], d[4], d[5]]
  const swapEnd = [d[0], d[1], d[2], d[3], d[5], d[4]]
  return [swapAB.join(' '), swapMid.join(' '), swapEnd.join(' ')]
}

function letterDecoys(letters: string): string[] {
  const l = letters.split('')
  return [`${l[1]}${l[0]}${l[2]}`, `${l[0]}${l[2]}${l[1]}`, `${l[2]}${l[1]}${l[0]}`]
}

const chunkedCode = tpl(
  {
    id: 'odepth-chunked-code',
    name: 'Chunk it, wait, then recall it',
    skillIds: ['o-memory'],
    bucket: 'observer',
    difficulty: 2,
    variants: CHUNK_CASES.length,
    minutes: 4,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, CHUNK_CASES)
    const total = c.digits.split(' ').reduce((a, x) => a + Number(x), 0)
    return {
      title: 'Six digits and three letters',
      prompt:
        'Nobody stores six loose digits well. Grouped into two chunks and said as two numbers, the same six become two things instead of six — which is the whole of what chunking does.',
      parts: [
        {
          study:
            `The code for ${c.setting} is:\n\n**${c.digits}** — aisle **${c.letters}**\n\n` +
            `${c.chunkHint} Say both chunks out loud twice, then say the three letters as a word-shape.`,
          studySeconds: 30,
          prompt:
            'First, something else entirely, to put a gap between studying and recalling.\n\nA shelf holds 4 boxes of 12 and 3 boxes of 8. How many items is that altogether?',
          answer: numeric(4 * 12 + 3 * 8, { unit: 'items' }),
          explanation: `4 × 12 = 48 and 3 × 8 = 24, so **72 items**. The arithmetic is not the point — occupying the same verbal channel the code is sitting in is the point.`,
          hints: [
            'Two multiplications and then an addition.',
            'Work out each group of boxes separately before adding them.',
            'Worked path: 48 + 24 = 72.',
          ],
        },
        {
          prompt: 'Now the code. Which six digits were they?',
          answer: mcq(rng, c.digits, digitDecoys(c.digits)),
          explanation:
            `**${c.digits}.** Every wrong option here is the right digits with one adjacent pair swapped, because that is how a remembered number actually degrades — the digits survive and their order does not. Chunking helps precisely here: an order error inside "four-seven-one" is much less likely than an order error inside a string of six.`,
          hints: [
            'Say the two chunks back as two numbers rather than reading the options.',
            'If one chunk is solid and the other is not, decide on the solid one first and use it to eliminate.',
            'The code is in the explanation once you have answered.',
          ],
        },
        {
          prompt: 'And the aisle letters?',
          answer: mcq(rng, c.letters, letterDecoys(c.letters)),
          explanation:
            `**${c.letters}.** Three letters look easy and are not: with nothing to say them AS, they are three separate items competing with the six digits you were also holding. Turning them into a shape or a nonsense word before the gap is what makes them one item instead of three.`,
          hints: [
            'Try to recall the sound or shape you gave the three letters rather than the letters themselves.',
            'The wrong options are all the same three letters reordered, so eliminating by letter will not work.',
            'The answer is in the explanation.',
          ],
        },
      ],
      hints: [
        'Chunk while studying: two three-digit numbers, and one shape for the letters.',
        'The arithmetic question in the middle is interference on purpose.',
        `While studying, notice the digits also sum to ${total} — a check you can use if one digit goes missing.`,
      ],
      explanation:
        `The code was **${c.digits}**, aisle **${c.letters}**.\n\n` +
        'Chunking works by trading count for size: short-term memory holds a small number of items, and an item can be a digit or a three-digit number, so grouping buys you capacity for free. It is not a trick for understanding anything — chunked material is held, not comprehended — and it is worth being clear about the difference, because a technique that helps you hold a formula does not help you know when to use it.',
    }
  },
)

const LINK_LISTS = [
  {
    story: 'A postman drops a LETTER into a WHEELBARROW, which rolls into a POND, frightening a HERON that lands on a DRUM.',
    present: ['letter', 'wheelbarrow', 'pond', 'heron', 'drum'],
    absent: ['postbox', 'shovel', 'fountain', 'seagull', 'trumpet'],
  },
  {
    story: 'A CANDLE melts onto a CHESSBOARD, sliding a piece into a TEACUP, which tips over a MAP and stains a BOOT.',
    present: ['candle', 'chessboard', 'teacup', 'map', 'boot'],
    absent: ['lantern', 'draughtboard', 'mug', 'atlas', 'sandal'],
  },
  {
    story: 'A BICYCLE crashes through a HEDGE and lands in a GREENHOUSE, cracking a PLANT POT that spills soil over a KEYBOARD.',
    present: ['bicycle', 'hedge', 'greenhouse', 'plant pot', 'keyboard'],
    absent: ['scooter', 'fence', 'garden shed', 'window box', 'laptop'],
  },
  {
    story: 'A KITE tangles in a WEATHERVANE, dropping a KEY into a GUTTER, where it lodges against a TENNIS BALL.',
    present: ['kite', 'weathervane', 'key', 'gutter', 'tennis ball'],
    absent: ['balloon', 'aerial', 'coin', 'drainpipe', 'golf ball'],
  },
  {
    story: 'A SUITCASE bursts open on a STAIRCASE, sending an ORANGE bouncing into a FIREPLACE beside a ROCKING CHAIR.',
    present: ['suitcase', 'staircase', 'orange', 'fireplace', 'rocking chair'],
    absent: ['rucksack', 'escalator', 'apple', 'radiator', 'armchair'],
  },
  {
    story: 'A FISHING ROD hooks a SCARF, which drags a LAMPSHADE off a PIANO and onto a SLEEPING CAT.',
    present: ['fishing rod', 'scarf', 'lampshade', 'piano', 'cat'],
    absent: ['walking stick', 'glove', 'curtain', 'organ', 'dog'],
  },
  {
    story: 'A WHEELCHAIR ramp launches a FOOTBALL through a WINDOW, into a BATHTUB, where it lands on a RUBBER DUCK.',
    present: ['ramp', 'football', 'window', 'bathtub', 'rubber duck'],
    absent: ['staircase', 'basketball', 'door', 'sink', 'toy boat'],
  },
  {
    story: 'A TYPEWRITER falls off a TROLLEY onto a PUMPKIN, splitting it over a CHESS CLOCK next to a BIRDCAGE.',
    present: ['typewriter', 'trolley', 'pumpkin', 'chess clock', 'birdcage'],
    absent: ['printer', 'wheelbarrow', 'melon', 'egg timer', 'fish tank'],
  },
]

const LINK_INTERFERENCE = [
  {
    prompt: 'Why does a chain of images hold a list together better than repeating the words?',
    correct: 'Each image gives you the cue for the next one',
    wrong: [
      'Pictures are stored more deeply than words',
      'Repeating words out loud does not use any memory at all',
      'A chain lets you store many more items than a list does',
    ],
    why: 'A linked chain is self-cueing: retrieving one item hands you the retrieval cue for the next. Repetition gives you no cues at all, so the first gap in the list ends the recall.',
  },
  {
    prompt: 'What is the weakness of a single chain of linked images?',
    correct: 'One broken link takes the rest of the chain with it',
    wrong: [
      'It takes longer to build than repetition',
      'It only works for lists of physical objects you can see',
      'The images have to be pleasant or they will not stick',
    ],
    why: 'The chain is sequential, so a lost link loses everything downstream. A route-based method does not have that fault, because every location is independently cued.',
  },
]

const linkedStory = tpl(
  {
    id: 'odepth-linked-story',
    name: 'A chain of images, tested after a gap',
    skillIds: ['o-memory', 'o-recall'],
    bucket: 'observer',
    difficulty: 3,
    variants: LINK_LISTS.length,
    minutes: 4.5,
    kind: 'multi',
    calibration: true,
  },
  (rng, seed) => {
    const l = cycle(seed, LINK_LISTS)
    const q = LINK_INTERFERENCE[seed % LINK_INTERFERENCE.length]
    return {
      title: 'Link the items into one scene',
      prompt:
        'The linking method joins a list into a single chain of images, each one colliding with the next. Retrieving the first hands you the second, and so on. You will study a chain, answer something else, and then be tested on which items were in it.',
      parts: [
        {
          study:
            `Read this chain twice and SEE each collision happen:\n\n**${l.story}**\n\n` +
            'The capital letters are the items. Do not rehearse the words — run the scene like a short film, twice.',
          studySeconds: 45,
          prompt: `Before the recall, a question about the method.\n\n${q.prompt}`,
          answer: mcq(rng, q.correct, q.wrong),
          explanation: `**${q.correct}.** ${q.why}`,
          hints: [
            'Think about what you have when you have retrieved just the first item.',
            'Ask what a chain gives you that a repeated list does not.',
            `Worked path: **${q.correct}**.`,
          ],
        },
        {
          prompt: 'Now the chain. Select **every** item that was actually in it. Exactly five of the ten were.',
          answer: multi(rng, l.present, l.absent),
          explanation:
            `In the chain: ${l.present.map((p) => `**${p}**`).join(', ')}.\n\n` +
            'The five decoys are near-synonyms of the real items — a mug for a teacup, a scooter for a bicycle. That is deliberate, and it is the standard way a vividly imagined scene degrades: the GIST survives while the exact item drifts to a neighbour. If you were confident about a near-miss, the image was strong and the word was not attached to it firmly.',
          hints: [
            'Replay the chain from the start rather than judging each option on its own.',
            'For each option ask where in the scene it appeared. A near-miss has no position in the film.',
            'Exactly five belong, so a sixth tick means one of the others is wrong.',
          ],
        },
      ],
      hints: [
        'Run the chain as a short film rather than repeating the words.',
        'Every pair of neighbouring items has to collide, not merely appear together.',
        'The middle question is interference on purpose — it is what makes the recall worth measuring.',
      ],
      explanation:
        `The chain held: ${l.present.map((p) => `**${p}**`).join(', ')}.\n\n` +
        'Linking is easier to build than a route and less robust to use, because it is a single sequence: lose one link and everything after it goes. That is a genuine trade-off rather than a flaw, and it is why the route method is the one worth learning if you only learn one. Neither method makes material easier to UNDERSTAND — both are for holding things in order, which is a narrower and more honest claim than mnemonics usually get.',
    }
  },
)

interface EncodingCase {
  material: string
  correct: string
  wrong: string[]
  why: string
}

const ENCODING_CASES: EncodingCase[] = [
  {
    material: 'Six errands to run in a particular order, with no paper to write on.',
    correct: 'Place them along a route you know well',
    wrong: [
      'Repeat the list over as you walk',
      'Write out the first letter of each one as a word',
      'Sort them into the two that matter and the four that do not',
    ],
    why: 'Ordered and arbitrary is exactly what a route handles: the locations supply the order and the cues. Repetition holds a list only while nothing interrupts, and errands are all interruption.',
  },
  {
    material: 'Why the tide is higher at some times of the month than others.',
    correct: 'Work out the mechanism until you could redraw it',
    wrong: [
      'Build a vivid image for each part of the explanation',
      'Repeat the key sentence until you can say it perfectly',
      'Put the stages along a route through your house',
    ],
    why: 'This is understanding, not a list, and mnemonics do not produce understanding. A memorised sentence about tides gets you a sentence; being able to redraw the arrangement gets you an answer to a question you have not seen.',
  },
  {
    material: 'Ten pairs of Spanish and English words for a vocabulary test on Friday.',
    correct: 'Test yourself on them across several days',
    wrong: [
      'Read the whole list through carefully five times over',
      'Link the ten pairs into one chain',
      'Copy the list out twice in your neatest handwriting',
    ],
    why: 'Paired material with a delayed test is what spaced retrieval is best at. Re-reading feels productive and is the weakest of the four; copying is re-reading with extra steps.',
  },
  {
    material: 'The running order of eight items for an assembly you are hosting tomorrow.',
    correct: 'Chain them so each item leads into the next',
    wrong: [
      'Learn the list of eight by repeating it several times',
      'Remember the first item and improvise the rest on the day',
      'Group the eight into two blocks',
    ],
    why: 'A running order is a sequence with no meaning of its own, which is the linking method\'s home ground. Grouping into blocks helps a little and still leaves the order inside each block unstored.',
  },
  {
    material: 'A friend\'s new address, which you will need in about a week.',
    correct: 'Recall it from memory tomorrow and again later',
    wrong: [
      'Look at it a few more times now',
      'Say it over ten times in a row until it feels solid',
      'Write it down somewhere and rely on finding the note',
    ],
    why: 'Retrieving it after a delay is what predicts still having it in a week, and the benefit of retrieval over restudy grows the longer the wait. Massed repetition feels solid immediately and fades fastest.',
  },
  {
    material: 'The order of the first ten elements in the periodic table.',
    correct: 'Turn the ten into a sentence you can say',
    wrong: [
      'Recite the ten names in order twenty times over',
      'Learn what each of the ten elements is actually used for',
      'Draw the ten symbols in a grid',
    ],
    why: 'An arbitrary order is what a first-letter sentence is for. Learning the uses is worth doing for its own sake and does nothing for the order, which is what the task asked about.',
  },
  {
    material: 'Five steps of a first-aid procedure that must be done in the right sequence.',
    correct: 'Practise doing the five in order, repeatedly',
    wrong: [
      'Attach each of the five steps to a room in your house',
      'Memorise a sentence of five words',
      'Read the five steps through carefully before you need them',
    ],
    why: 'A procedure has to be executed under pressure, and doing it is what builds that. A mnemonic gets you the list of steps, which is not the same as being able to carry them out while something is happening.',
  },
  {
    material: 'Which three of your twelve classmates said they could come on Saturday.',
    correct: 'Attach each name to something they said',
    wrong: [
      'Repeat the three names on the way home',
      'Count how many said yes and remember just the number',
      'Assume you will remember because there are only three',
    ],
    why: 'Names are the hardest items there are, because a name is arbitrary and a person is not. Attaching each to something they actually said gives the name a hook the person supplies.',
  },
]

const encodingChoice = tpl(
  {
    id: 'odepth-encoding-choice',
    name: 'Which encoding suits this material?',
    skillIds: ['o-memory'],
    bucket: 'observer',
    difficulty: 3,
    variants: ENCODING_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ENCODING_CASES)
    return {
      title: 'Match the method to the material',
      prompt: `You need to hold onto this:\n\n> ${c.material}\n\nWhich approach fits it best?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'First decide what KIND of material it is: an arbitrary ordered list, a set of pairs, an explanation, or a procedure.',
        'Mnemonics are for material with no meaning of its own. If the material has a mechanism, learn the mechanism.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The single most useful distinction is between material that MEANS something and material that does not. Arbitrary ordered lists — errands, running orders, sequences of symbols — are what routes and chains are for, and they work well there. Explanations are not lists, and dressing one up as a mnemonic gives you a sentence you can recite and cannot use. Where the test is delayed, retrieving from memory beats reading again, and the gap between the two grows the longer the delay.',
    }
  },
)

/* ==================================================================
 * o-selection — the rows that never reached the table
 * ================================================================== */

const BOUNDS_CONTEXTS = [
  { who: 'students', asked: 'were handed a slip about the new library hours', claim: 'the new hours are an improvement' },
  { who: 'members', asked: 'were emailed about the change of meeting night', claim: 'the new night suits them better' },
  { who: 'residents', asked: 'were given a card about the redesigned bus stop', claim: 'the redesigned stop is easier to use' },
  { who: 'customers', asked: 'were sent a form about the new opening times', claim: 'the new times work better for them' },
]

/** Chosen so the replier share, the floor and the ceiling are all whole. */
const BOUNDS_NUMBERS = [
  { total: 400, replied: 80, yes: 60 },
  { total: 500, replied: 100, yes: 85 },
  { total: 600, replied: 120, yes: 96 },
  { total: 800, replied: 160, yes: 136 },
]

/**
 * The honest output of a low-response survey is not a corrected figure, it is a
 * RANGE — and the range is computable, which is what makes this worth doing as
 * arithmetic rather than as a warning. `unseen-review-gap` asks what a rating
 * would become under one supposition; this asks for both ends at once, so the
 * learner sees the width rather than a single alternative number.
 */
const responseBounds = tpl(
  {
    id: 'odepth-response-bounds',
    name: 'How wide is the honest range?',
    skillIds: ['o-selection', 'm-percent'],
    bucket: 'observer',
    difficulty: 3,
    variants: BOUNDS_CONTEXTS.length * BOUNDS_NUMBERS.length,
    minutes: 4,
    kind: 'multi',
  },
  (_rng, seed) => {
    const ctx = BOUNDS_CONTEXTS[seed % BOUNDS_CONTEXTS.length]
    const n = BOUNDS_NUMBERS[Math.floor(seed / BOUNDS_CONTEXTS.length) % BOUNDS_NUMBERS.length]
    const silent = n.total - n.replied
    const amongRepliers = Math.round((n.yes / n.replied) * 100)
    const floor = Math.round((n.yes / n.total) * 100)
    const ceiling = Math.round(((n.yes + silent) / n.total) * 100)
    return {
      title: 'The figure, the floor and the ceiling',
      prompt:
        `All ${n.total} ${ctx.who} ${ctx.asked}. ${n.replied} of them replied, and ${n.yes} of those replies agreed that ${ctx.claim}.\n\n` +
        'A poster goes up quoting a single percentage. Work out what that percentage can and cannot be.',
      parts: [
        {
          prompt: `Among the ${n.replied} who replied, what percentage agreed? Give a whole number.`,
          answer: numeric(amongRepliers, { unit: '%' }),
          explanation: `${n.yes} out of ${n.replied} is **${amongRepliers}%**. This is the figure that goes on the poster, and it is a true statement about the ${n.replied} people who answered.`,
          hints: [
            'Divide the agreeing replies by the number of replies.',
            'Then turn that into a percentage.',
            `Worked path: ${n.yes} ÷ ${n.replied} = ${amongRepliers / 100}, so ${amongRepliers}%.`,
          ],
        },
        {
          prompt: `Now the floor. If every one of the ${silent} people who did not reply would have disagreed, what percentage of all ${n.total} would agree?`,
          answer: numeric(floor, { unit: '%' }),
          explanation: `The agreeing count stays at ${n.yes} and the base becomes ${n.total}, giving **${floor}%**. That is the worst the true figure could be, given what was actually collected.`,
          hints: [
            'The number agreeing does not change; only what you divide by does.',
            `Divide ${n.yes} by ${n.total} this time.`,
            `Worked path: ${n.yes} ÷ ${n.total} = ${floor / 100}, so ${floor}%.`,
          ],
        },
        {
          prompt: `And the ceiling. If every one of those ${silent} non-repliers would have agreed, what percentage of all ${n.total} would agree?`,
          answer: numeric(ceiling, { unit: '%' }),
          explanation:
            `${n.yes} + ${silent} = ${n.yes + silent} agreeing out of ${n.total}, which is **${ceiling}%**. ` +
            `So everything the survey establishes is that the true figure lies somewhere between ${floor}% and ${ceiling}% — a band ${ceiling - floor} points wide, with the poster quoting ${amongRepliers}%.`,
          hints: [
            'Add every non-replier to the agreeing side, then divide by the total.',
            `The agreeing count becomes ${n.yes} + ${silent}.`,
            `Worked path: ${n.yes + silent} ÷ ${n.total} = ${ceiling / 100}, so ${ceiling}%.`,
          ],
        },
      ],
      hints: [
        'Three divisions, and the only thing that changes between them is what goes on the top and the bottom.',
        'The floor assumes the silent group all disagreed; the ceiling assumes they all agreed.',
        'Neither end is a guess about what they think — they are the limits of what the data allows.',
      ],
      explanation:
        `The poster figure is ${amongRepliers}%, and the survey itself only narrows the truth to somewhere between ${floor}% and ${ceiling}% — a band ${ceiling - floor} percentage points wide.\n\n` +
        'That width is the honest output, and it is why "we got a low response rate" is not a small caveat to add at the end. Note what this does NOT say: nobody knows what the silent group thinks, and the floor is not a better estimate than the poster figure. Both ends are what the arithmetic permits. The only way to narrow the band is to hear from the people who did not answer, and no amount of analysis of the ones who did can substitute for that.',
    }
  },
)

interface DirectionCase {
  scene: string
  key: 'up' | 'down' | 'unclear'
  why: string
}

const DIRECTION_KEYS = {
  up: 'It pushes the reported figure up',
  down: 'It pushes the reported figure down',
  unclear: 'The direction cannot be worked out',
}
const DIRECTION_EXTRA = 'The filter does not affect this figure'

/**
 * Naming the filter is where `unseen-missing-who` stops. The next question —
 * which WAY does it bend the number? — is the one that decides whether a
 * finding is exaggerated or understated, and it cannot be answered by reflex.
 * Three of the eight cases have an unresolvable direction, so the item cannot
 * be beaten by always answering "up".
 */
const DIRECTION_CASES: DirectionCase[] = [
  {
    scene:
      'A climbing wall reports that 92% of climbers finish the intermediate route. The figure counts only climbers who attempted it, and the wall staff advise people who look unready to try the easier route first.',
    key: 'up',
    why: 'The people most likely to fail are diverted before they can be counted, so the finishing rate rises without anybody climbing better.',
  },
  {
    scene:
      'A school reports an average lunch queue of 6 minutes, timed by a member of staff standing at the till with a stopwatch on five occasions.',
    key: 'down',
    why: 'A queue measured while somebody is visibly timing it, at the till itself, tends to be a queue on its best behaviour — and five occasions chosen by the timer are unlikely to include the worst days.',
  },
  {
    scene:
      'A council reports that 40% of a park\'s visitors arrive on foot, based on a survey run at the main gate on three Saturday mornings.',
    key: 'unclear',
    why: 'A Saturday morning at the main gate could over-represent walkers from nearby streets or drivers on a weekend outing. Without knowing which, the direction of the error is genuinely unknown.',
  },
  {
    scene:
      'A bookshop reports that its average customer spends 22 minutes browsing, measured by staff noting arrival and departure times whenever they happen to notice both.',
    key: 'up',
    why: 'A customer who is in and out in ninety seconds is much less likely to be noticed twice than one who lingers, so long visits are over-counted.',
  },
  {
    scene:
      'A helpline publishes an average answer time of 90 seconds. Calls that ring for more than three minutes are dropped by the system and never enter the log.',
    key: 'down',
    why: 'The longest waits are deleted by the very rule that defines the log, so the average is computed on a sample with its worst cases removed.',
  },
  {
    scene:
      'A revision app reports that its users study for 46 minutes a day, counted from the app\'s own timer among users who have the timer switched on.',
    key: 'unclear',
    why: 'Switching a study timer on could mark the diligent, who study more, or the anxious, who study in short bursts and want credit for it. Both are plausible and the figure cannot separate them.',
  },
  {
    scene:
      'A cycling group reports an average ride distance of 34 km, from rides that members chose to upload to the shared log.',
    key: 'up',
    why: 'A ride worth uploading is usually a good one. The short, dull and abandoned rides stay off the log, so the average describes the rides people were pleased with.',
  },
  {
    scene:
      'A supermarket reports that 3% of deliveries arrive late, counting a delivery as late only when the customer telephones to report it.',
    key: 'down',
    why: 'Every late delivery that the customer shrugged off is invisible, and shrugging it off is the commonest response. The count is of complaints, and it is being reported as a count of lateness.',
  },
]

const filterDirection = tpl(
  {
    id: 'odepth-filter-direction',
    name: 'Which way does the filter bend it?',
    skillIds: ['o-selection'],
    bucket: 'observer',
    difficulty: 4,
    variants: DIRECTION_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, DIRECTION_CASES)
    const key = DIRECTION_KEYS[c.key]
    const others = (Object.keys(DIRECTION_KEYS) as (keyof typeof DIRECTION_KEYS)[])
      .filter((k) => k !== c.key)
      .map((k) => DIRECTION_KEYS[k])
    return {
      title: 'Up, down, or unknowable',
      prompt: `${c.scene}\n\nSomething has decided which cases got counted. Which way does that push the published figure?`,
      answer: mcq(rng, key, [...others, DIRECTION_EXTRA]),
      hints: [
        'Work out first who is missing, then ask whether the missing group would have scored higher or lower than the ones counted.',
        'If the missing group could plausibly sit on either side, the honest answer is that the direction is unknown — and that is one of the options here.',
        `Worked path: **${key}**.`,
      ],
      explanation:
        `**${key}.** ${c.why}\n\n` +
        'Spotting a filter is the first half of the skill and it is the half that gets taught. The direction is the half that decides what to do: a figure you know is inflated can still be used as an upper bound, a figure you know is deflated is a floor, and a figure whose direction is unknown is not usable as either. Three of the cases in this family genuinely cannot be resolved, so "unknown" is a real answer here rather than a way out.',
    }
  },
)

interface FixCase {
  scene: string
  correct: string
  wrong: string[]
  why: string
}

const FIX_CASES: FixCase[] = [
  {
    scene: 'A club measures how well its coaching works by surveying members at the end-of-season party.',
    correct: 'Contact everybody who signed up in September',
    wrong: [
      'Hand the survey out at two more events',
      'Ask more detailed questions of the members at the party',
      'Run the same survey at the party again next season',
    ],
    why: 'The party is attended by people who stayed. Going back to the September list is the only option that reaches the ones who left, and they are the whole missing group.',
  },
  {
    scene: 'A shop judges a new layout by counting compliments from customers at the till.',
    correct: 'Compare sales and walk-outs before and after',
    wrong: [
      'Ask the staff on the tills what they have been hearing',
      'Count the compliments for longer',
      'Put out a comment card for customers to fill in at the till',
    ],
    why: 'Compliments come from people who both liked it and chose to say so. A measure that every customer contributes to without deciding to is what replaces that, and sales and walk-outs are exactly such a measure.',
  },
  {
    scene: 'A teacher judges whether a homework website helps by looking at the marks of pupils who used it.',
    correct: 'Compare against pupils who did not use it',
    wrong: [
      'Look at the marks of the frequent users separately',
      'Ask the users whether it helped',
      'Track the same pupils across a second term of use',
    ],
    why: 'Pupils who choose to use a website may already be the ones who do their work. Only a group who did not use it can show what those marks would have been anyway.',
  },
  {
    scene: 'A council estimates cycling levels from a counter installed on the new cycle path.',
    correct: 'Count riders on the roads around it as well',
    wrong: [
      'Leave the counter running longer',
      'Add a second counter at the other end of the same path',
      'Ask cyclists using the path how often they ride it',
    ],
    why: 'A counter on the new path can only ever count people on the new path. Whether cycling rose or merely moved is a question about the surrounding roads.',
  },
  {
    scene: 'A magazine works out the most reliable washing machine from letters readers send in.',
    correct: 'Draw a sample of owners and ask them all',
    wrong: [
      'Wait until several hundred more letters have arrived',
      'Separate the letters by the age of the machine involved',
      'Ask readers for good news as well',
    ],
    why: 'Letters are written by people with something to say, and inviting the other kind of letter still leaves the writing optional. Choosing who to ask is what removes the filter.',
  },
  {
    scene: 'A gym advertises results using before-and-after figures from clients who completed the twelve-week plan.',
    correct: 'Report on everyone who started the plan',
    wrong: [
      'Publish the figures for a much larger group of finishers',
      'Include the clients who completed at a different branch',
      'Break the finishers down by attendance',
    ],
    why: 'Anyone who stopped is missing, and stopping is what happens to people it is not working for. Reporting on the whole starting group is the only fix that includes them.',
  },
  {
    scene: 'A festival judges its food stalls by the star ratings left on its app during the weekend.',
    correct: 'Hand a rating card to every tenth person served',
    wrong: [
      'Encourage more people to leave a rating',
      'Weight the app ratings by how many people bought food',
      'Compare the app ratings against the queue lengths seen',
    ],
    why: 'App ratings are left by people who chose to open the app. Sampling the queue systematically decides who is asked rather than letting willingness decide it.',
  },
  {
    scene: 'A school reports how safe pupils feel using a form linked from the school website.',
    correct: 'Give the form out in one lesson to every class',
    wrong: [
      'Send everybody a reminder email',
      'Keep the form open for a longer period of several weeks',
      'Add more questions to the form about specific places',
    ],
    why: 'A form on a website is filled in by whoever visits the website and decides to. Handing it out in class means the sample is the classes, not the volunteers.',
  },
]

const fixTheCollection = tpl(
  {
    id: 'odepth-fix-collection',
    name: 'Which change would actually fix it?',
    skillIds: ['o-selection'],
    bucket: 'observer',
    difficulty: 3,
    variants: FIX_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FIX_CASES)
    return {
      title: 'Repair the collection, not the analysis',
      prompt: `${c.scene}\n\nWhich change would actually fix the problem, rather than producing more of the same number?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Name the filter first: what had to happen for somebody to be counted?',
        'Then check each option: does it change WHO gets counted, or only how many of the same kind?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The three wrong options are all real improvements to the study, which is what makes them tempting: more data, longer runs, finer questions and better analysis are usually good ideas. None of them touches the filter. A larger sample of the same self-selected group is a more precise measurement of the same wrong thing — precision and accuracy are different, and only one of them is fixed by collecting more.',
    }
  },
)

/* ==================================================================
 * o-expect — what would this look like if it were false?
 * ================================================================== */

interface FalsifierCase {
  belief: string
  correct: string
  wrong: string[]
  why: string
}

/**
 * `unseen-discriminate` asks which check separates two rival stories.
 * This asks a narrower and harder question: name the single result that would
 * force you to ABANDON the belief. Every distractor is a result that would be
 * mildly awkward for the belief and survivable, which is what most people
 * actually offer when asked what would change their mind.
 */
const FALSIFIER_CASES: FalsifierCase[] = [
  {
    belief: 'The corner shop puts its bread out at 7 am every weekday.',
    correct: 'The shelf is empty at 8 am on a Wednesday',
    wrong: [
      'There is less bread than usual',
      'Somebody who works there says it varies week to week',
      'The bread on Monday looks like it was baked elsewhere',
    ],
    why: 'An empty shelf an hour after the claimed time cannot be squared with "out at 7". Low stock, hearsay and a different bakery are all compatible with bread arriving at 7.',
  },
  {
    belief: 'My phone loses charge much faster since the last update.',
    correct: 'The same route home used the same charge as before',
    wrong: [
      'The battery is at 30% earlier in the day than it used to be',
      'Somebody online reports the same problem',
      'The phone feels warmer than it did a couple of months ago',
    ],
    why: 'A matched comparison — same activity, same duration, same starting charge — is the only listed result the belief cannot absorb. Everything else changes with how the phone was used that day.',
  },
  {
    belief: 'The new seating plan is why the class is quieter.',
    correct: 'The other class got quieter without changing seats',
    wrong: [
      'One or two pupils still talk in lessons',
      'The teacher says the plan has made very little difference',
      'The class was already getting quieter before the change',
    ],
    why: 'A comparison class that improved with no seating change removes the seating plan as the explanation. Residual talking and an opinion leave the claim intact, and the pre-existing trend weakens it without killing it.',
  },
  {
    belief: 'This route to school is faster than the one through the park.',
    correct: 'Timed on the same morning, the park route won',
    wrong: [
      'The park route felt quicker on a couple of occasions',
      'The park route is shorter in distance',
      'Somebody in the year above prefers going through the park',
    ],
    why: 'Same morning, same walker, stopwatch on both is the comparison the claim is about. Feelings, distance and preference are each compatible with this route still being faster.',
  },
  {
    belief: 'The plant on the landing is growing faster than the one in the hall.',
    correct: 'Measured monthly, the hall plant grew more',
    wrong: [
      'The landing plant has lost two of its lower leaves',
      'The hall plant was repotted',
      'The landing gets noticeably more light in the afternoon',
    ],
    why: 'Growth is measurable, and a measurement that goes the other way ends the claim. Lost leaves, repotting and light levels are all reasons a comparison might turn out either way.',
  },
  {
    belief: 'Our team concedes most of its goals in the last twenty minutes.',
    correct: 'The log shows most goals conceded before half time',
    wrong: [
      'The team conceded early in the last two matches played',
      'The players say they feel most tired towards the end',
      'The opposition make late substitutions',
    ],
    why: 'The claim is about a distribution, so only the distribution can refute it. Two recent matches are a sample of two, and tiredness and substitutions are mechanisms, not counts.',
  },
  {
    belief: 'The library is quietest on Tuesday afternoons.',
    correct: 'A headcount found Thursday afternoons quieter',
    wrong: [
      'It was busier than expected on one particular Tuesday',
      'The librarian thinks Wednesday mornings are the quietest',
      'A study group now meets on Tuesdays',
    ],
    why: 'Quietest is a comparison across days, so another day being quieter is the refutation. One busy Tuesday is noise, an opinion is not a count, and a new group changes the future rather than the past.',
  },
  {
    belief: 'Practising scales is what improved my sight-reading.',
    correct: 'A month off scales left sight-reading unchanged',
    wrong: [
      'Sight-reading improved less in the second month than the first',
      'A teacher says sight-reading practice matters more than scales',
      'Somebody else improved without scales',
    ],
    why: 'Removing the supposed cause and watching the effect stay put is the strongest thing on the list. Another person\'s route says nothing about which of your activities did the work.',
  },
]

const nameTheFalsifier = tpl(
  {
    id: 'odepth-name-falsifier',
    name: 'What would make you drop it?',
    skillIds: ['o-expect'],
    bucket: 'observer',
    difficulty: 4,
    variants: FALSIFIER_CASES.length,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FALSIFIER_CASES)
    return {
      title: 'Name the result that would sink it',
      prompt: `Somebody believes:\n\n> ${c.belief}\n\nWhich result would actually force them to give the belief up?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Take each result and ask whether the belief could survive it with a small excuse attached.',
        'A belief that can absorb every result on the list was never risking anything. Look for the one with no excuse available.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The three others are what people usually produce when asked what would change their mind: results that are mildly inconvenient and entirely survivable. That is not dishonesty, it is how beliefs are built — each one comes with a small supply of repairs. The question worth asking before any test is which result you would NOT be able to repair, because if there is no such result, running the test changes nothing.',
    }
  },
)

interface CouldFailSet {
  belief: string
  lines: { text: string; risky: boolean }[]
  note: string
}

/**
 * A count rather than a judgement, because the interesting failure is that a
 * pile of evidence FEELS proportional to its weight. Making the learner sort
 * six items and report a number forces each one to be examined; asking "is this
 * good evidence?" about the pile does not.
 */
const COULD_FAIL_SETS: CouldFailSet[] = [
  {
    belief: 'This charging cable is faulty.',
    lines: [
      { text: 'It charged nothing when plugged into my phone', risky: true },
      { text: 'It looks a bit worn where it meets the plug', risky: false },
      { text: 'A different cable charged the phone straight away', risky: true },
      { text: 'It was the cheapest cable in the shop at the time', risky: false },
      { text: 'This cable charged a second phone with no trouble', risky: true },
      { text: 'Cables like this one do not last very long', risky: false },
    ],
    note: 'Three of these could have come out the other way and told you something. Appearance, price and general reputation would read exactly the same whether or not this cable works.',
  },
  {
    belief: 'The new revision timetable is helping me.',
    lines: [
      { text: 'My last three test scores were higher than before', risky: true },
      { text: 'I feel more organised than I did last term', risky: false },
      { text: 'I covered four topics this week against two before', risky: true },
      { text: 'Everybody says having a timetable is a good idea', risky: false },
      { text: 'I stuck to the timetable on five days out of seven', risky: false },
      { text: 'The topics I revised came up better than the ones I did not', risky: true },
    ],
    note: 'Sticking to a timetable measures compliance, not benefit — you could follow it perfectly and learn nothing. Feeling organised and general approval both survive any outcome.',
  },
  {
    belief: 'The back gate is being left open by the delivery drivers.',
    lines: [
      { text: 'The gate was open on a day with no deliveries', risky: true },
      { text: 'A driver was seen going through the gate last week', risky: false },
      { text: 'The gate was shut every day during a delivery break', risky: true },
      { text: 'Delivery drivers are usually in a hurry', risky: false },
      { text: 'The gate has been open several times this month', risky: false },
      { text: 'The gate was open within ten minutes of a delivery', risky: true },
    ],
    note: 'The gate being open at all is compatible with anybody opening it. Only the observations that link the opening to deliveries, or break the link, could come out either way.',
  },
  {
    belief: 'My sister has been borrowing my headphones.',
    lines: [
      { text: 'They were paired to her laptop in the settings', risky: true },
      { text: 'She has borrowed things of mine before now', risky: false },
      { text: 'They were on my desk where I always leave them', risky: true },
      { text: 'She does not have headphones of her own', risky: false },
      { text: 'The volume was set much higher than I leave it', risky: true },
      { text: 'She was in my room at some point on Tuesday', risky: false },
    ],
    note: 'Opportunity, history and need are all reasons to suspect and none of them is a result that could have gone the other way. The pairing list, the position and the volume each could.',
  },
  {
    belief: 'The heating in this room comes on before the rest of the house.',
    lines: [
      { text: 'This radiator was warm while the hall one was cold', risky: true },
      { text: 'This room is the first one off the boiler cupboard', risky: false },
      { text: 'Both radiators were the same temperature at 7 am', risky: true },
      { text: 'The room feels warmer than the hall most mornings', risky: false },
      { text: 'The pipes to this room are shorter than the others', risky: false },
      { text: 'The hall radiator warmed first on three of five days', risky: true },
    ],
    note: 'Pipe layout is a mechanism, not a result: it explains why the claim might be true and cannot show that it is. How a room feels tracks draughts, carpets and sunlight.',
  },
  {
    belief: 'That app is draining my data allowance.',
    lines: [
      { text: 'The usage screen lists it as the largest user', risky: true },
      { text: 'It is the app I have open the most each day', risky: false },
      { text: 'Data use fell by half in a week without it', risky: true },
      { text: 'Apps of that kind are known for using data', risky: false },
      { text: 'My allowance ran out earlier than usual this month', risky: false },
      { text: 'Data use stayed the same in a week without it', risky: true },
    ],
    note: 'Running out early is consistent with any cause at all, including a change in what everybody else in the house is doing. Note that two of the risky lines contradict each other — both are legitimate tests, and only one of them happened.',
  },
  {
    belief: 'The team plays better when the captain starts the match.',
    lines: [
      { text: 'They won four of five with the captain starting', risky: true },
      { text: 'The captain is the most experienced player there', risky: false },
      { text: 'They won three of four without the captain starting', risky: true },
      { text: 'The players say the captain organises the defence', risky: false },
      { text: 'Goals conceded per match were level either way', risky: true },
      { text: 'The captain has started most matches this season', risky: false },
    ],
    note: 'Experience, testimony and how often the captain starts are all real facts that would look identical whether the claim is true or false. Only the paired records can separate them.',
  },
  {
    belief: 'The corner of the ceiling is damp because of the roof.',
    lines: [
      { text: 'The patch grew during the week of heavy rain', risky: true },
      { text: 'The roof on that side is the oldest part of it', risky: false },
      { text: 'The patch stayed exactly the same through the rain', risky: true },
      { text: 'Damp patches in ceilings usually come from roofs', risky: false },
      { text: 'A bathroom sits directly above that corner', risky: false },
      { text: 'The patch is directly under a cracked roof tile', risky: true },
    ],
    note: 'The bathroom above is a rival explanation rather than evidence for this one, and general statistics about ceilings say nothing about this ceiling.',
  },
]

const countCouldFail = tpl(
  {
    id: 'odepth-count-could-fail',
    name: 'How much of this could have failed?',
    skillIds: ['o-expect'],
    bucket: 'observer',
    difficulty: 3,
    variants: COULD_FAIL_SETS.length,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const s = cycle(seed, COULD_FAIL_SETS)
    const risky = s.lines.filter((l) => l.risky).length
    return {
      title: 'Count the evidence that risked something',
      prompt:
        `Somebody believes:\n\n> ${s.belief}\n\nThey offer six reasons:\n\n${s.lines.map((l, i) => `${i + 1}. ${l.text}`).join('\n')}\n\n` +
        'How many of the six could have come out the other way — that is, would look different if the belief were false? Give a whole number.',
      answer: numeric(risky, { unit: 'lines' }),
      hints: [
        'Take each line and imagine the belief is false. Would you still expect to see that line?',
        'If the answer is "yes, that would be true either way", the line is not evidence about this belief at all.',
        `Worked path: ${risky} of the six could have come out differently, so ${6 - risky} could not.`,
      ],
      explanation:
        `**${risky} of the six.** ${s.note}\n\n` +
        'Counting matters because a list of six reasons feels roughly twice as convincing as a list of three, and here it should not: the lines that could not have come out differently add nothing at all, however true they are. This is also the cheapest possible check on your own reasoning — go through what you would say if challenged, and count how many of your points would still be true if you were wrong.',
    }
  },
)

interface RiskyPredictionCase {
  setup: string
  correct: string
  wrong: string[]
  why: string
}

const RISKY_CASES: RiskyPredictionCase[] = [
  {
    setup: 'Two people predict how a school fundraiser will go.',
    correct: 'It will raise between £400 and £500',
    wrong: [
      'It will raise a decent amount if the weather holds up',
      'It will do about as well as usual',
      'It will raise more than nothing, which is what matters',
    ],
    why: 'A band with two edges can be wrong in two directions, and most outcomes fall outside it. The others are constructed so that almost any result confirms them.',
  },
  {
    setup: 'Two people predict what a new bus timetable will do to journeys.',
    correct: 'The 8:10 will reach town before 8:35',
    wrong: [
      'Journeys will feel a bit smoother',
      'Some people will find the new timetable an improvement',
      'The route will work better once everybody gets used to it',
    ],
    why: 'One bus, one destination, one time is checkable on Monday morning. "Some people" and "feel smoother" cannot fail, and "once everybody gets used to it" postpones the test forever.',
  },
  {
    setup: 'Two people predict how a plant will do in a new spot.',
    correct: 'It will put out at least three new leaves by May',
    wrong: [
      'It will be happier there than it was in the old place',
      'It should do better in more light',
      'It will probably improve unless something else goes wrong',
    ],
    why: 'A count and a date can both be missed. "Happier" is not observable, and a prediction with "unless something else goes wrong" attached has an exit built in.',
  },
  {
    setup: 'Two people predict the effect of a new revision method.',
    correct: 'My next mock will be above 65%',
    wrong: [
      'I will understand the material more deeply than before',
      'It will help before long',
      'My revision will feel much less chaotic from now on',
    ],
    why: 'A threshold on a specific test is a real bet. Depth of understanding is unmeasured, "not straight away" delays the check indefinitely, and how revision feels is available either way.',
  },
  {
    setup: 'Two people predict how a football season will end.',
    correct: 'We will finish in the top four of the league',
    wrong: [
      'We will do better than last time',
      'We will have a season with some real highlights in it',
      'We will be somewhere around the middle or above',
    ],
    why: 'Top four excludes sixteen of twenty possible finishes. "Around the middle or above" excludes almost nothing, and "some real highlights" is guaranteed by any season.',
  },
  {
    setup: 'Two people predict what will happen to a repaired bike.',
    correct: 'The chain will not come off in the next month',
    wrong: [
      'The bike will be much more reliable from here on',
      'It should be fine unless ridden hard',
      'The repair will hold up as well as could be expected',
    ],
    why: 'A specific fault, a specific window, and a clear way to lose. "Unless it gets ridden hard" is the giveaway: the excuse is written into the prediction before any evidence arrives.',
  },
  {
    setup: 'Two people predict what a new club rule will change.',
    correct: 'Attendance will pass thirty at the next three meetings',
    wrong: [
      'The atmosphere at meetings will improve quite a lot',
      'More people will come along once word gets around the school',
      'It will make a difference to how the club runs',
    ],
    why: 'A number, repeated across three occasions, gives three chances to be wrong. "Once word gets around" moves the deadline every time it is checked.',
  },
  {
    setup: 'Two people predict how a shop will do after a refit.',
    correct: 'Saturday takings will beat £900 within a month',
    wrong: [
      'Customers will notice the difference when they come in',
      'It will be worth what it cost them in the long run',
      'Trade should pick up from now on',
    ],
    why: 'A figure, a day and a deadline can all be missed together. "In the long run" and "should pick up" have no point at which anybody could say they were wrong.',
  },
]

const riskiestPrediction = tpl(
  {
    id: 'odepth-riskiest-prediction',
    name: 'Which prediction is actually risking something?',
    skillIds: ['o-expect'],
    bucket: 'observer',
    difficulty: 3,
    variants: RISKY_CASES.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, RISKY_CASES)
    return {
      title: 'The prediction that could be wrong',
      prompt: `${c.setup}\n\nWhich prediction is taking a real risk — the one with the most ways to turn out wrong?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'For each prediction, try to describe an outcome that would make it FALSE. If that is hard, the prediction is not risking much.',
        'Look for numbers, deadlines and thresholds; then look for the escape hatches — "should", "unless", "in the long run", "some people".',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'A prediction is worth exactly as much as the outcomes it rules out. That is an uncomfortable standard, because a risky prediction can be publicly wrong and a vague one cannot — which is precisely why vague ones are more popular. The practical version is to add a number and a date to anything you claim will happen, and to notice when somebody else has carefully avoided both.',
    }
  },
)

/* ==================================================================
 * o-anchor — the figure that arrived first
 * ================================================================== */

interface FirstImpressionCase {
  setup: string
  correct: string
  wrong: string[]
  why: string
}

/**
 * Anchoring beyond prices. The same mechanism runs on judgements of quality:
 * whatever you assessed first sets the scale for what follows, and the effect
 * is invisible from inside because the later judgement feels like a direct
 * reading of the thing. Every scenario here is about the JUDGE's own process,
 * never about sizing up a person.
 */
const FIRST_IMPRESSION_CASES: FirstImpressionCase[] = [
  {
    setup:
      'You are marking twelve practice essays for a study group. The first three you happen to pick up are outstanding. You give the fourth a low mark.',
    correct: 'Mark all twelve, then rank them and revise',
    wrong: [
      'Try to put the first three out of your mind before marking',
      'Mark the fourth again after a break',
      'Give the fourth the benefit of the doubt and raise it slightly',
    ],
    why: 'The scale was set by whichever essays came first, so the repair is to compare against the whole set rather than against the memory of three. Trying not to be influenced does not work, and nudging one mark up guesses at a correction instead of measuring one.',
  },
  {
    setup:
      'You are choosing a second-hand guitar. The shop shows you a beautiful £700 one first, then a £280 one, which now seems like a bargain.',
    correct: 'Look up what that model sells for elsewhere',
    wrong: [
      'Ask to see something cheaper first',
      'Compare the £280 one against the £700 one more carefully',
      'Wait a week and see whether the £280 still appeals to you',
    ],
    why: 'Bargain is a comparison, and the shop chose what it was compared against. Only a price from outside the shop can tell you whether £280 is one.',
  },
  {
    setup:
      'You are judging a photography competition. The first entry you open is the strongest thing you have seen all year.',
    correct: 'Score every entry, then re-score the first ten',
    wrong: [
      'Set the first entry aside and judge the rest normally',
      'Note that the first entry was strong and adjust for it',
      'Judge the rest in a random order',
    ],
    why: 'Entries judged early were scored on a different scale from entries judged late, and the only fix is to go back with the whole range in view. Noting the problem and adjusting is exactly the move that has been shown not to work.',
  },
  {
    setup:
      'You are estimating how long a group project will take. Somebody opens with "it is basically a weekend\'s work".',
    correct: 'Time one section, then multiply up from that',
    wrong: [
      'Suggest a week and a half as a more sensible figure',
      'Agree on a weekend plus some slack',
      'Ask whether they have done this kind of thing before',
    ],
    why: 'A measured section gives a total that owes nothing to the opening figure. Every other option is measured from "a weekend", including the one that disagrees with it.',
  },
  {
    setup:
      'You are trying two cafés. The first flat white you try is the best you have had; the second, an hour later, tastes ordinary.',
    correct: 'Try both again on separate days and rank them',
    wrong: [
      'Trust the first impression, since it was the stronger one',
      'Assume the second café is simply not as good as the first',
      'Order something different at the second',
    ],
    why: 'Two things tasted an hour apart are being compared, and the order of the comparison is doing some of the work. Separating them in time is what removes it.',
  },
  {
    setup:
      'You are setting a target for how many books to read this year. A list you saw yesterday said "the average reader manages twelve".',
    correct: 'Count what you read last year and start there',
    wrong: [
      'Aim for fifteen, just above average',
      'Take twelve as the target since it is a normal figure',
      'Aim for ten, since you are busier than most readers',
    ],
    why: 'Your own last year is the reference class that fits you, and it exists whether or not you ever saw the list. All three other options are twelve with an adjustment attached.',
  },
  {
    setup:
      'You are valuing a box of old comics. The first one you look up is worth £60; the rest look disappointing beside it.',
    correct: 'Price every comic before judging any of them',
    wrong: [
      'Sort them against the £60 one',
      'Assume the rest are worth much less than the first',
      'Look up the second one and compare it to the first',
    ],
    why: 'The £60 became the scale because it was drawn first. Pricing everything before ranking anything removes the accident of order from the result.',
  },
  {
    setup:
      'You are deciding how much to charge for a weekend of dog-walking. A neighbour mentions that somebody once charged them £15 for the whole weekend.',
    correct: 'Work out hours needed times an hourly rate',
    wrong: [
      'Ask for £25, above the fifteen',
      'Offer £15 since that is what the going rate seems to be',
      'Suggest £20 as a compromise between the two figures',
    ],
    why: 'Hours times a rate is a floor you built. One remembered figure from one occasion is not a going rate, and every other option treats it as the origin of the scale.',
  },
]

const firstImpressionScale = tpl(
  {
    id: 'odepth-first-impression-scale',
    name: 'The first one sets the scale',
    skillIds: ['o-anchor'],
    bucket: 'observer',
    difficulty: 3,
    variants: FIRST_IMPRESSION_CASES.length,
    minutes: 2.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, FIRST_IMPRESSION_CASES)
    return {
      title: 'Whatever came first is now the ruler',
      prompt: `${c.setup}\n\nWhat is the best move from here?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask which of these options produces a figure or a judgement that does not depend on what you happened to see first.',
        'Deciding to ignore an influence is not a method. Look for the option that changes the procedure instead.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The uncomfortable part of this effect is that noticing it does not switch it off. Telling yourself to disregard the first item leaves the scale exactly where it was, and adjusting deliberately just moves you a little way along a ruler somebody else laid down. What works is procedural: build your own figure from something you measured, or judge the whole set before scoring any of it, so that no single early item gets to define the range.',
    }
  },
)

const RECOMPUTE_CASES = [
  { thing: 'a used trumpet', unit: 'pounds', sold: [180, 150, 210], opening: 320 },
  { thing: 'a second-hand tent', unit: 'pounds', sold: [70, 55, 85], opening: 140 },
  { thing: 'a weekend of garden clearing', unit: 'pounds', sold: [95, 110, 80], opening: 150 },
  { thing: 'a used games console', unit: 'pounds', sold: [130, 100, 145], opening: 210 },
  { thing: 'painting a small shed', unit: 'pounds', sold: [60, 45, 75], opening: 120 },
  { thing: 'a folding bike', unit: 'pounds', sold: [230, 190, 270], opening: 400 },
  { thing: 'a set of six chairs', unit: 'pounds', sold: [90, 120, 105], opening: 190 },
  { thing: 'two days of dog-sitting', unit: 'pounds', sold: [40, 55, 34], opening: 90 },
]

const REBUILD_KEY = 'A number heard first changes what later figures feel like'
const RECOMPUTE_POOL = [
  'It stops the other side from opening the bidding first of all',
  'It makes the conversation a good deal shorter',
  'It shows the other side that you have done your homework properly',
  'Written figures are harder for anybody to argue with',
]

const rebuildTheNumber = tpl(
  {
    id: 'odepth-rebuild-number',
    name: 'Build your own figure first',
    skillIds: ['o-anchor', 'm-stats'],
    bucket: 'observer',
    difficulty: 3,
    variants: RECOMPUTE_CASES.length,
    minutes: 3.5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, RECOMPUTE_CASES)
    const total = c.sold.reduce((a, b) => a + b, 0)
    const mean = total / 3
    const gap = c.opening - mean
    return {
      title: 'Three real sales against one opening figure',
      prompt:
        `You are working out what ${c.thing} is worth. Three closely comparable ones changed hands recently at **${c.sold[0]}**, **${c.sold[1]}** and **${c.sold[2]}** ${c.unit}.\n\n` +
        `Before you finish, the other side opens with **${c.opening} ${c.unit}**.`,
      parts: [
        {
          prompt: `What is the average of the three completed sales, in ${c.unit}?`,
          answer: numeric(mean, { unit: c.unit }),
          explanation: `${c.sold[0]} + ${c.sold[1]} + ${c.sold[2]} = ${total}, and ${total} ÷ 3 = **${mean}**. Three completed sales are a reference class: figures somebody actually paid, which exist whether or not the opening was ever said.`,
          hints: [
            'Add the three completed sales, then divide by three.',
            `The three figures total ${total}.`,
            `Worked path: ${total} ÷ 3 = ${mean}.`,
          ],
        },
        {
          prompt: `How far above that average is the opening figure, in ${c.unit}?`,
          answer: numeric(gap, { unit: c.unit }),
          explanation: `${c.opening} − ${mean} = **${gap}**. That distance is the part worth noticing, because if you had never computed the average, this gap is precisely what you would have been arguing inside without knowing it.`,
          hints: [
            'Subtract the average you worked out from the opening figure.',
            `The opening is ${c.opening}.`,
            `Worked path: ${c.opening} − ${mean} = ${gap}.`,
          ],
        },
        {
          prompt: 'Why is it worth writing your own figure down BEFORE hearing theirs?',
          answer: mcq(rng, REBUILD_KEY, rotateDecoys(seed, RECOMPUTE_POOL)),
          explanation:
            '**A number heard first changes what later figures feel like.** That is the whole mechanism: an opening figure does not present itself as an opinion to be resisted, it quietly becomes the scale that every later number is read against — including the one you were about to say.\n\nWriting yours down first is not about being stubborn. It gives you something to compare their figure TO, so that the conversation is between two numbers with sources rather than one number and a series of adjustments to it.',
          hints: [
            'Think about what changes between hearing a figure and not hearing it.',
            'The other options are all real advantages; only one of them is about your own judgement.',
            'Worked path: it is about the effect on you, not the effect on them.',
          ],
        },
      ],
      hints: [
        'Two calculations: an average of three real sales, then a subtraction.',
        'The opening figure plays no part in the first calculation at all.',
        'The last part asks what the ordering of the conversation does to you.',
      ],
      explanation:
        `Three comparable sales average ${mean} ${c.unit}, and the opening figure sits ${gap} ${c.unit} above that.\n\n` +
        'The habit worth taking from this is small and specific: build a figure from a reference class before the conversation starts, and write it somewhere you can see it. That the opening number moves people is one of the more heavily replicated findings in this area. What does NOT work well is deciding to allow for it — the adjustment starts from their number, which means they still chose the ruler. Replace the number; do not wrestle it.',
    }
  },
)

interface WhoseNumberCase {
  scene: string
  correct: string
  wrong: string[]
  why: string
}

const WHOSE_NUMBER_CASES: WhoseNumberCase[] = [
  {
    scene:
      'A phone listing shows: launch price £749, seller\'s asking price £310, your maximum budget £280, and completed sales of the same model at £265.',
    correct: 'The £749 launch price from three years ago',
    wrong: ['The £310 the seller is asking for it', 'The £280 you decided you could spend', 'The £265 that the model actually sells for now'],
    why: 'A launch price nobody is charging now exists on the page only to make £310 look modest. Your budget and the completed sales both come from outside the listing.',
  },
  {
    scene:
      'A gym advert shows: full annual price £480, today\'s offer £288, the cost of the pool-only membership £180, and what you currently pay elsewhere £22 a month.',
    correct: 'The £480 full price nobody is being offered',
    wrong: ['The £288 that is actually on offer', 'The £180 charged for the pool-only membership', 'The £22 a month you pay at present'],
    why: 'The full price is the reference the offer is measured against, and it is chosen by the seller. Every other figure here is one somebody could genuinely pay today.',
  },
  {
    scene:
      'A fundraising page shows: a suggested donation of £50, a total raised so far of £1,240, a target of £2,000, and your own monthly giving budget of £15.',
    correct: 'The £50 suggested on the donate button',
    wrong: ['The £1,240 raised by the page so far', 'The £2,000 target that was set for the appeal', 'The £15 a month you have budgeted'],
    why: 'A suggested amount is the page\'s choice of where your thinking should start. The raised figure and the target are facts about the appeal, and the budget is yours.',
  },
  {
    scene:
      'A quote for fixing a laptop shows: the shop\'s estimate £180, the part on sale online for £54, the shop\'s hourly labour rate £45, and a friend who paid £120 for the same repair.',
    correct: 'The £180 estimate you were handed first',
    wrong: ['The £54 the part costs on its own', 'The £45 an hour they charge for labour', 'The £120 your friend paid for this repair'],
    why: 'The estimate arrives first and sets the range. Part plus labour builds a floor from the ground up, and a friend\'s completed repair is a comparable case.',
  },
  {
    scene:
      'A holiday listing shows: "usually £890", this week £624, the price of the same dates on two other sites £610 and £645, and the amount you have saved £700.',
    correct: 'The £890 the listing calls the usual price',
    wrong: ['The £624 being charged this week', 'The £610 quoted for the same dates elsewhere', 'The £700 you have actually saved up'],
    why: 'The usual price is a claim by the seller about a price that is not currently on offer anywhere. The two rival sites are independent, and your savings were fixed before you opened the page.',
  },
  {
    scene:
      'A revision guide advert shows: "worth £60 of tutoring", the price £24, the cost of the school\'s own booklet £8, and the £30 you spent on the last one you bought.',
    correct: 'The "worth £60 of tutoring" comparison',
    wrong: ['The £24 the guide costs to buy', 'The £8 the school booklet costs', 'The £30 you spent on the last one you bought'],
    why: 'Nobody is selling £60 of tutoring here; the figure exists to be compared against. The other three are prices that were or could be paid.',
  },
  {
    scene:
      'A charity shop prices a jacket at £18, with a label showing an original retail price of £120, similar jackets in the same shop at £15 and £22, and a £20 note in your pocket.',
    correct: 'The £120 printed on the original label',
    wrong: ['The £18 the shop is actually charging today', 'The £15 on a similar jacket nearby', 'The £20 you happen to have on you'],
    why: 'An original retail price on a second-hand item is history, not an offer, and it makes £18 feel like a rescue. The neighbouring jackets are the real comparison class.',
  },
  {
    scene:
      'A ticket page shows: face value £45, resale price £96, what two friends paid £38 and £41, and the £50 you told yourself was your limit.',
    correct: 'The £96 the reseller has decided to ask',
    wrong: ['The £45 printed as the face value', 'The £38 that one friend paid for theirs', 'The £50 limit you set for yourself'],
    why: 'The resale figure is the one number here chosen by somebody who benefits from where you start. Face value and what friends paid are both independent of the seller.',
  },
]

const whoseNumber = tpl(
  {
    id: 'odepth-whose-number',
    name: 'Which figure did somebody choose for you?',
    skillIds: ['o-anchor'],
    bucket: 'observer',
    difficulty: 3,
    variants: WHOSE_NUMBER_CASES.length,
    minutes: 2.5,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, WHOSE_NUMBER_CASES)
    return {
      title: 'Sort the numbers by where they came from',
      prompt: `${c.scene}\n\nWhich of these figures is there to set the scale — chosen by somebody with an interest in where your thinking starts?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask of each number: could anybody actually pay or receive this today?',
        'A figure nobody is charging is not a price. It is a reference point, and somebody picked it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'Sorting the numbers by SOURCE is the move, and it takes about ten seconds. Some figures come from the world — completed sales, rival quotes, what a friend paid, what you have. Some come from the person on the other side of the transaction, and those are chosen for their effect on you rather than for their accuracy. Neither kind is a lie; only one kind is evidence about value.',
    }
  },
)

/* ==================================================================
 * o-frame — the same measurement, wearing different clothes
 * ================================================================== */

const FREQUENCY_CONTEXTS = [
  { subject: 'A seed supplier', reports: 'of the seeds in a packet fail to come up', total: 200, unit: 'seeds', otherSide: 'come up', thisSide: 'fail' },
  { subject: 'A delivery firm', reports: 'of its parcels arrive after the promised day', total: 500, unit: 'parcels', otherSide: 'arrive on time', thisSide: 'arrive late' },
  { subject: 'A phone maker', reports: 'of its batteries drop below half capacity within two years', total: 200, unit: 'batteries', otherSide: 'stay above half', thisSide: 'drop below half' },
  { subject: 'A recycling depot', reports: 'of the bins it collects are rejected for contamination', total: 500, unit: 'bins', otherSide: 'are accepted', thisSide: 'are rejected' },
]
const FREQUENCY_PCTS = [4, 8, 12, 20]

const FREQUENCY_KEY = 'Nothing has changed — both report one measurement'
const FREQUENCY_POOL = [
  'The count is a more accurate figure than the share',
  'The percentage describes a different group entirely',
  'The second version counts a smaller set of items',
  'One of the two sentences must have been rounded off',
  'The share and the count were measured on separate days',
]

/**
 * Natural frequencies, not the complement subtraction. `unseen-frame-convert`
 * already teaches "100 minus x"; this converts a percentage into a COUNT out of
 * a stated group, which is a different operation and the one the framing
 * literature actually recommends as a repair. The closing question keys to
 * "nothing has changed", which also keeps the observer bucket's benign-answer
 * coverage away from zero.
 */
const frameFrequency = tpl(
  {
    id: 'odepth-frame-frequency',
    name: 'Say the percentage as a count',
    skillIds: ['o-frame', 'm-percent'],
    bucket: 'observer',
    difficulty: 2,
    variants: FREQUENCY_CONTEXTS.length * FREQUENCY_PCTS.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const ctx = FREQUENCY_CONTEXTS[seed % FREQUENCY_CONTEXTS.length]
    const pct = FREQUENCY_PCTS[Math.floor(seed / FREQUENCY_CONTEXTS.length) % FREQUENCY_PCTS.length]
    const affected = (ctx.total * pct) / 100
    const rest = ctx.total - affected
    return {
      title: 'One measurement, three sentences',
      prompt: `${ctx.subject} reports that **${pct}%** ${ctx.reports}.\n\nTake a batch of **${ctx.total} ${ctx.unit}** and say the same thing in counts.`,
      parts: [
        {
          prompt: `How many of the ${ctx.total} ${ctx.unit} ${ctx.thisSide}?`,
          answer: numeric(affected, { unit: ctx.unit }),
          explanation: `${pct}% of ${ctx.total} is **${affected}**. A percentage is a rate; the count is what that rate looks like in a batch you could actually put on a table.`,
          hints: [
            'A percentage of a total is that percentage times the total.',
            `Take ${pct}% of ${ctx.total}.`,
            `Worked path: ${ctx.total} × ${pct} ÷ 100 = ${affected}.`,
          ],
        },
        {
          prompt: `And how many of the ${ctx.total} ${ctx.otherSide}?`,
          answer: numeric(rest, { unit: ctx.unit }),
          explanation: `${ctx.total} − ${affected} = **${rest}**. The two counts have to add to ${ctx.total}, because between them they cover every item in the batch.`,
          hints: [
            'The two groups together make up the whole batch.',
            `Subtract your first answer from ${ctx.total}.`,
            `Worked path: ${ctx.total} − ${affected} = ${rest}.`,
          ],
        },
        {
          prompt: `Between "${pct}% ${ctx.thisSide}" and "${affected} in every ${ctx.total} ${ctx.thisSide}", what has changed about the finding?`,
          answer: mcq(rng, FREQUENCY_KEY, rotateDecoys(seed, FREQUENCY_POOL)),
          explanation:
            `**${FREQUENCY_KEY}.** Nothing was recounted between the two sentences and no new data arrived — one is the other multiplied by ${ctx.total} and divided by 100.\n\n` +
            'What DOES change is how the two land. A percentage under about ten is hard to picture and easy to wave away; a count out of a stated batch is something you can imagine looking at. Neither version is dishonest, and whichever one you are shown is a choice somebody made about how you would react. The habit worth having is to do the conversion yourself in both directions, and check whether your reaction survives.',
          hints: [
            'Compare what was measured in each version, not how each version feels.',
            'Ask whether anybody counted anything new between the two sentences.',
            'Worked path: the two sentences are the same measurement in different units.',
          ],
        },
      ],
      hints: [
        'One multiplication, then one subtraction.',
        `Both counts have to add up to ${ctx.total}.`,
        'The last part asks what actually changed between two ways of saying it.',
      ],
      explanation:
        `${pct}% of ${ctx.total} is ${affected}, leaving ${rest}. All three sentences report one measurement.\n\n` +
        'Converting a rate into a count out of a named group is the most useful single repair against framing, because it makes small percentages picturable and large ones less overwhelming. It is worth doing in both directions: when you are given a scary count, work out the rate, and when you are given a comfortable rate, work out the count.',
    }
  },
)

interface OppositeFrameCase {
  offer: string
  correct: string
  wrong: string[]
  why: string
}

const OPPOSITE_CASES: OppositeFrameCase[] = [
  {
    offer: 'A club offer: "keep four of your six free periods and help at the stall in the other two".',
    correct: 'Give up two of your six free periods',
    wrong: [
      'Give up four of the six free periods you have',
      'Keep two of your six free periods',
      'Give up two of your six free periods every week',
    ],
    why: 'Six minus four leaves two, so the loss frame is two. One option swaps the numbers, one flips which side is kept, and one adds a weekly repetition nobody mentioned.',
  },
  {
    offer: 'A phone plan: "80% of your data rolls over to the following month".',
    correct: 'A fifth of unused data is lost each month',
    wrong: [
      'A fifth of your total data is lost',
      'Four fifths of your unused data is lost monthly',
      'A fifth of unused data is lost in the first month',
    ],
    why: 'The 80% is a share of UNUSED data, so the loss is a fifth of the unused part. One option changes the base to total data, one flips the fraction, and one limits it to the first month.',
  },
  {
    offer: 'A refund policy: "return within 30 days for a full refund".',
    correct: 'After 30 days you get nothing back',
    wrong: [
      'After 30 days you get part back',
      'Before 30 days you get a partial refund back',
      'After 30 days you can still exchange the item',
    ],
    why: 'The policy names a full refund inside the window and says nothing about outside it except by implication — and the implication is nothing, not something reduced.',
  },
  {
    offer: 'A ticket deal: "buy five and the sixth is free".',
    correct: 'You pay for five sixths of the tickets',
    wrong: [
      'You pay four fifths of the price',
      'You pay for five of every five tickets you take',
      'You pay for five sixths of the first six tickets',
    ],
    why: 'Six tickets, five paid for, so five sixths. Four fifths is the same deal counted with the wrong denominator, and the last option quietly limits it to the first six.',
  },
  {
    offer: 'A council notice: "three quarters of the street will keep weekly collections".',
    correct: 'A quarter of the street loses weekly collections',
    wrong: [
      'A quarter of the street keeps weekly collections still',
      'Three quarters of the street lose weekly collections',
      'A quarter of the street loses collections',
    ],
    why: 'Losing weekly collections is not the same as losing collections, and the last option makes that swap. The other two simply reverse the fractions.',
  },
  {
    offer: 'A guarantee: "9 out of 10 repairs are finished the same day".',
    correct: 'One repair in ten runs past the same day',
    wrong: [
      'One repair in nine runs past the same day',
      'One repair in ten is never finished',
      'One repair in ten runs past the following day',
    ],
    why: 'Nine of ten same-day leaves one of ten later. The other options change the denominator, change "later" into "never", and move the deadline on by a day.',
  },
  {
    offer: 'A trip form: "pupils who return the slip by Friday are guaranteed a place".',
    correct: 'A late slip means a place is not guaranteed',
    wrong: [
      'A late slip means a place has been refused',
      'An early slip means a place is not guaranteed',
      'A late slip means the trip may well be cancelled',
    ],
    why: 'Not guaranteed and refused are different outcomes, and treating a lost guarantee as a refusal is the commonest reading error here.',
  },
  {
    offer: 'A savings account: "you can withdraw twice a year without losing interest".',
    correct: 'A third withdrawal costs you some interest',
    wrong: [
      'A third withdrawal costs all the interest',
      'A second withdrawal costs you some of the interest',
      'A third withdrawal is not permitted by the account',
    ],
    why: 'Two free withdrawals means the third is the one that costs. How MUCH interest is lost is not stated, so "all of it" adds a detail, and "not permitted" invents a restriction.',
  },
]

const oppositeFrame = tpl(
  {
    id: 'odepth-opposite-frame',
    name: 'State it as the loss',
    skillIds: ['o-frame'],
    bucket: 'observer',
    difficulty: 3,
    variants: OPPOSITE_CASES.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, OPPOSITE_CASES)
    return {
      title: 'Same deal, other side',
      prompt: `${c.offer}\n\nWhich sentence describes exactly the same deal from the other side?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Work out the two groups the offer splits things into, and check that both restatements cover the same split.',
        'The wrong ones each change one thing: the base, the fraction, the time limit, or how bad the other outcome is.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'Offers are almost always written in whichever frame sounds better, which is not dishonest but is a choice made for you. Restating a deal as its loss takes a few seconds and does two things: it checks that you have understood the split, and it lets you notice whether your enthusiasm was about the deal or about the wording. If the loss version changes your mind, the wording was doing the work.',
    }
  },
)

interface SameMeasureSet {
  headline: string
  same: string[]
  different: string[]
  note: string
}

const SAME_MEASURE_SETS: SameMeasureSet[] = [
  {
    headline: 'Of the 50 trips booked last year, 40 went ahead.',
    same: ['Ten of the fifty trips did not run', 'Four in five of the trips went ahead', 'Twenty per cent of trips were cancelled'],
    different: ['Forty per cent of trips went ahead', 'Ten trips were cancelled this year', 'Four in five pupils went on a trip'],
    note: 'The three that differ change the rate, the year, or what is being counted — pupils are not trips, and a count from a different year is a different measurement entirely.',
  },
  {
    headline: 'The team won 15 of its 25 matches.',
    same: ['Three fifths of the matches were won', 'Ten matches were not won by the team', 'The team failed to win 40% of matches'],
    different: ['Ten of the matches were lost outright', 'The team won 15% of its matches', 'The win rate rose to three fifths'],
    note: 'Not-won includes draws, so "lost" is a different claim. The other two turn a count into a percentage and a level into a change.',
  },
  {
    headline: '90 of the 300 seats were empty at the concert.',
    same: ['Seventy per cent of the seats were filled', 'Two hundred and ten seats were taken', 'Three in ten seats stayed empty'],
    different: ['Ninety per cent of the seats were filled', 'Three hundred people came to the concert', 'Ninety seats were empty at every concert'],
    note: 'The first different line swaps the count for a percentage that happens to share a digit — the commonest trap in this shape.',
  },
  {
    headline: 'Of 80 forms handed out, 60 came back completed.',
    same: ['Three quarters of the forms came back', 'Twenty forms did not come back', 'A quarter of the forms went missing'],
    different: ['Sixty per cent of the forms came back', 'Twenty people refused to fill one in', 'Three quarters of pupils returned a form'],
    note: 'Forms that did not come back are not the same as people who refused, and one person could have had more than one form.',
  },
  {
    headline: 'The bus was on time on 18 of 20 mornings.',
    same: ['It was late on two of the twenty', 'It ran on time nine mornings in ten', 'Ten per cent of mornings it was late'],
    different: ['It was late on two mornings each week', 'It ran on time on 18% of mornings', 'Punctuality improved to nine in ten'],
    note: 'Twenty mornings is four weeks, so "two each week" multiplies the lateness by four. The last line reports a level as an improvement.',
  },
  {
    headline: 'A survey of 200 people found 150 had heard of the scheme.',
    same: ['Fifty of those asked had not heard of it', 'Three quarters had heard of the scheme', 'A quarter of those asked had not'],
    different: ['Fifty people in the town had not heard', 'Three quarters of the town had heard of it', 'Awareness of the scheme rose to 75%'],
    note: 'Two hundred people asked is not the town, and a survey reports a level rather than a rise unless there is an earlier figure to compare against.',
  },
  {
    headline: 'Of 120 plants, 96 survived the winter.',
    same: ['Twenty-four plants did not survive', 'Four fifths of the plants survived', 'One plant in five was lost over winter'],
    different: ['Ninety-six per cent of plants survived', 'Twenty-four plants were killed by frost', 'Four fifths of the beds came through'],
    note: 'What killed the twenty-four is not in the headline, and beds are not plants. The percentage line reuses the count as a rate.',
  },
  {
    headline: 'The shop sold 45 of the 60 tickets it was given.',
    same: ['Fifteen of the tickets went unsold', 'Three quarters of the tickets sold', 'A quarter of the tickets were left'],
    different: ['Forty-five per cent of tickets sold', 'Fifteen people missed out on a ticket', 'The shop sold three quarters of all tickets'],
    note: 'Unsold tickets are not disappointed people, and "all tickets" is a bigger set than the sixty this shop was given.',
  },
]

const sameMeasurement = tpl(
  {
    id: 'odepth-same-measurement',
    name: 'Which of these is the same measurement?',
    skillIds: ['o-frame'],
    bucket: 'observer',
    difficulty: 3,
    variants: SAME_MEASURE_SETS.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const s = cycle(seed, SAME_MEASURE_SETS)
    return {
      title: 'Same fact, or a different one?',
      prompt:
        `A report states:\n\n> ${s.headline}\n\nSelect **every** sentence below that reports exactly the same measurement. Exactly three of the six do.`,
      answer: multi(rng, s.same, s.different),
      hints: [
        'Check three things in each sentence: what is being counted, what it is counted out of, and whether it is a level or a change.',
        'A restatement may flip the sentence around or swap counts for fractions. It cannot change the base or the thing being counted.',
        `Worked path: the three that match are "${s.same.join('", "')}".`,
      ],
      explanation:
        `The same measurement: ${s.same.map((x) => `**${x}**`).join(', ')}.\n\n${s.note}\n\n` +
        'Every sentence in the wrong column is one substitution away from being right, which is what makes them work: the number survives and what it is a number OF quietly changes. The three substitutions to check for, in order, are the base it is divided by, the thing being counted, and whether the sentence reports a level or a change. Nothing else is needed, and doing it in that order catches almost all of them.',
    }
  },
)

/* ==================================================================
 * o-claimtype — measured, concluded, or supposed
 * ================================================================== */

interface MeasuredCountSet {
  source: string
  lines: { text: string; measured: boolean }[]
  note: string
}

const MEASURED_SETS: MeasuredCountSet[] = [
  {
    source: 'A school newsletter piece about the new bike shelter',
    lines: [
      { text: 'The shelter holds 24 bikes and cost £3,100', measured: true },
      { text: 'On average 19 bikes were parked there each day in May', measured: true },
      { text: 'The shelter has made cycling to school more popular', measured: false },
      { text: 'It will need to be extended within two years', measured: false },
      { text: 'Three bikes were reported damaged during the term', measured: true },
      { text: 'Pupils feel safer leaving their bikes there now', measured: false },
    ],
    note: 'Popularity, future capacity and how pupils feel are all reasonable things to say and none of them was counted. The three counts are a capacity, a cost, and two tallies.',
  },
  {
    source: 'A local paper report on a resurfaced road',
    lines: [
      { text: 'The work took eleven days and closed one lane', measured: true },
      { text: 'Traffic counts fell from 8,400 to 7,900 vehicles a day', measured: true },
      { text: 'Drivers are avoiding the road because of the works', measured: false },
      { text: 'The new surface will last at least fifteen years', measured: false },
      { text: 'Two residents complained about noise at night', measured: true },
      { text: 'The road is now safer than it was before', measured: false },
    ],
    note: 'The count of complaints is a measurement of complaints, not of noise — but it is still something somebody recorded, which is what "measured" means here.',
  },
  {
    source: 'A product page for a rucksack',
    lines: [
      { text: 'It weighs 940 grams empty and holds 28 litres', measured: true },
      { text: 'The straps survived 5,000 cycles on the test rig', measured: true },
      { text: 'It is comfortable on walks of several hours', measured: false },
      { text: 'The fabric will not fade in ordinary use', measured: false },
      { text: 'It has six pockets, two of them waterproof', measured: true },
      { text: 'It is the best value bag in its class', measured: false },
    ],
    note: 'Comfort, fading and value are all claims somebody could investigate and none of them is reported as a reading here.',
  },
  {
    source: 'A club report on a change of meeting night',
    lines: [
      { text: 'Attendance averaged 31 before the change and 24 after', measured: true },
      { text: 'Fourteen members said Thursday suited them better', measured: true },
      { text: 'The drop is because of the clash with football', measured: false },
      { text: 'Attendance will recover once people adjust', measured: false },
      { text: 'The room costs £18 a night on Thursdays', measured: true },
      { text: 'Members prefer the new night on the whole', measured: false },
    ],
    note: 'Fourteen people saying something is a measurement of what fourteen people said. Whether members on the whole prefer it is a different claim about a bigger group.',
  },
  {
    source: 'A field study of a hedge',
    lines: [
      { text: 'The hedge runs 340 metres along the north edge', measured: true },
      { text: 'Eleven bird species were recorded in six visits', measured: true },
      { text: 'The hedge is the richest habitat on the farm', measured: false },
      { text: 'Removing it would reduce the bird count', measured: false },
      { text: 'Its widest point measured 2.4 metres across', measured: true },
      { text: 'It has been there since before the farm was split', measured: false },
    ],
    note: 'Richest habitat is a comparison and nothing else was surveyed. The hedge\'s age is a historical claim with no observation behind it in this study.',
  },
  {
    source: 'A write-up of a cooking experiment',
    lines: [
      { text: 'Six batches were baked, three at each temperature', measured: true },
      { text: 'The hotter batches browned in 19 minutes, the others in 27', measured: true },
      { text: 'The hotter batches taste better than the cooler ones', measured: false },
      { text: 'Any oven will produce the same difference', measured: false },
      { text: 'All six batches used flour from the same bag', measured: true },
      { text: 'Temperature is the main thing that matters in baking', measured: false },
    ],
    note: 'Taste was not tested, other ovens were not tried, and "the main thing that matters" ranges far beyond one experiment with one variable.',
  },
  {
    source: 'A report on a change to library opening hours',
    lines: [
      { text: 'The library now opens at 8:30 rather than 9:15', measured: true },
      { text: 'Visits between 8:30 and 9:15 averaged 22 a day', measured: true },
      { text: 'Those visits are people who could not come before', measured: false },
      { text: 'The earlier opening will become permanent', measured: false },
      { text: 'Staff hours rose by four and a half a week', measured: true },
      { text: 'The change has been good value for the money', measured: false },
    ],
    note: 'Twenty-two early visits could be new users or the same users arriving earlier, and the report has no way to tell. Value is a judgement about a trade nobody has priced here.',
  },
  {
    source: 'A summary of a school\'s recycling week',
    lines: [
      { text: 'Paper collected rose from 41 kg to 58 kg', measured: true },
      { text: 'Nine of the twelve classes took part', measured: true },
      { text: 'The posters are what persuaded the classes to join', measured: false },
      { text: 'The habit will stick once the week is over', measured: false },
      { text: 'Two collection bins were added on the ground floor', measured: true },
      { text: 'Pupils now understand why recycling matters', measured: false },
    ],
    note: 'The posters, the habit and pupils\' understanding are three claims about causes, futures and minds. Weights, counts and a change to the bins are all things somebody wrote down.',
  },
]

const countMeasured = tpl(
  {
    id: 'odepth-count-measured',
    name: 'How many of these were measured?',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 2,
    variants: MEASURED_SETS.length,
    minutes: 2.5,
  },
  (_rng, seed) => {
    const s = cycle(seed, MEASURED_SETS)
    const measured = s.lines.filter((l) => l.measured).length
    return {
      title: 'Count the measurements',
      prompt:
        `${s.source} contains these six lines:\n\n${s.lines.map((l, i) => `${i + 1}. ${l.text}`).join('\n')}\n\n` +
        'How many of the six report something that was actually measured, counted or recorded? Give a whole number.',
      answer: numeric(measured, { unit: 'lines' }),
      hints: [
        'A measured line reports a reading, a count, a date, a price or a plain fact somebody wrote down.',
        'Anything about a cause, a future, a preference or a comparison with something not measured is not a reading, however reasonable it is.',
        `Worked path: ${measured} of the six are readings, so ${6 - measured} are conclusions or guesses.`,
      ],
      explanation:
        `**${measured} of the six.** ${s.note}\n\n` +
        'The reason for counting rather than sorting is that a short piece of writing mixes all three kinds in the same confident tone, and reading it as a whole leaves an impression of a well-evidenced report. Counting the readings gives you the actual size of the evidence base, and it is usually smaller than the piece feels. None of this makes the other lines wrong — a report with no conclusions in it would be useless — but the reader has to be able to see the join.',
    }
  },
)

interface UpgradeNeedCase {
  claim: string
  context: string
  correct: string
  wrong: string[]
  why: string
}

const UPGRADE_NEED_CASES: UpgradeNeedCase[] = [
  {
    context: 'A school newsletter reports that the new water fountains were installed in March.',
    claim: '"Pupils are drinking more water than they used to."',
    correct: 'Water taken from the fountains before and after',
    wrong: [
      'The number of fountains installed around the site',
      'How many pupils say they drink more than before',
      'The cost of installing the new water fountains',
    ],
    why: 'A volume before and after is the measurement the claim is about. Self-reports measure beliefs about drinking, and neither the count of fountains nor the cost bears on how much anybody drank.',
  },
  {
    context: 'A shop reports that it moved the bread to the back of the store in April.',
    claim: '"Customers are picking up more items on the way to the bread."',
    correct: 'Items per basket before and after the move',
    wrong: [
      'The number of customers coming in each week',
      'How far the bread now is from the entrance',
      'Which items are on the shelves along that route',
    ],
    why: 'Items per basket is exactly what the claim asserts changed. Footfall, distance and shelf contents are all about the setup rather than the outcome.',
  },
  {
    context: 'A club reports that it started a beginners\' session in September.',
    claim: '"The beginners\' session is keeping new members from dropping out."',
    correct: 'How long new members stayed in previous years',
    wrong: [
      'How many people came to the beginners\' sessions',
      'What the new members say about the sessions',
      'The number of new members who joined this year',
    ],
    why: 'Dropping out is a rate over time, and it needs an earlier rate to be compared with. Attendance and joining figures say nothing about who left.',
  },
  {
    context: 'A council reports that it repainted the crossing markings in June.',
    claim: '"Drivers are stopping for pedestrians more often now."',
    correct: 'Observed stops per crossing before and after',
    wrong: [
      'The number of crossings that were repainted',
      'How visible the new paint is at night time',
      'How many pedestrians use the crossing every day',
    ],
    why: 'The claim is about driver behaviour, so somebody has to watch drivers. Paint visibility is a mechanism and pedestrian counts are a different variable.',
  },
  {
    context: 'A teacher reports that homework was moved from Friday to Monday in January.',
    claim: '"More homework is being handed in on time."',
    correct: 'On-time rates for the terms either side',
    wrong: [
      'The number of pieces of homework set each week',
      'What pupils say about the new hand-in day',
      'How many pupils are in the class this year',
    ],
    why: 'An on-time rate before and after is the only listed figure that could come out against the claim. The rest describe the arrangement rather than the result.',
  },
  {
    context: 'A café reports that it started opening at seven rather than eight in May.',
    claim: '"The early hour is bringing in customers who would otherwise go elsewhere."',
    correct: 'Whether total daily sales rose or just shifted',
    wrong: [
      'How many customers come in between seven and eight',
      'What the early customers say about the new hour',
      'How many other cafés open before eight nearby',
    ],
    why: 'Customers arriving at seven might be the same people who used to arrive at eight. Only the daily total can separate new trade from moved trade.',
  },
  {
    context: 'A sports club reports that it changed its warm-up routine in October.',
    claim: '"The new warm-up is reducing injuries."',
    correct: 'Injuries per hour played, before and after',
    wrong: [
      'The number of players doing the new warm-up',
      'How long the new warm-up takes to complete',
      'What the physiotherapist thinks of the routine',
    ],
    why: 'Injuries have to be counted against exposure, or a quiet season looks like a successful warm-up. An expert opinion is a judgement about a mechanism, not a measurement of the outcome.',
  },
  {
    context: 'A library reports that it put new fiction on a display table by the door in February.',
    claim: '"The display table is getting people to borrow books they would not have found."',
    correct: 'Borrowing of those titles before the display',
    wrong: [
      'How many books are on the display table',
      'How many books were borrowed from the table',
      'Which titles the librarians chose to display',
    ],
    why: 'Books borrowed from the table might be books that would have been borrowed anyway. Their earlier borrowing rate is the comparison that makes the claim testable.',
  },
]

const whatWouldUpgradeIt = tpl(
  {
    id: 'odepth-upgrade-need',
    name: 'What measurement is missing?',
    skillIds: ['o-claimtype', 'o-expect'],
    bucket: 'observer',
    difficulty: 4,
    variants: UPGRADE_NEED_CASES.length,
    minutes: 3,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, UPGRADE_NEED_CASES)
    return {
      title: 'From guess to judgement',
      prompt:
        `${c.context}\n\nThe piece then says:\n\n> ${c.claim}\n\nAs written, nothing measured supports that. Which single missing figure would turn it into a judgement the findings could carry?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Read the claim and name the thing it says changed. That is what has to be measured.',
        'Three of the options describe the setup — how many, how far, how long, what people say. None of those is the outcome.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation:
        `**${c.correct}.** ${c.why}\n\n` +
        'The distinction being trained is between measuring the INTERVENTION and measuring the OUTCOME. Counting how many fountains were installed, how far the bread moved, or how many people attended is real data about what was done — and a claim about what CHANGED needs the other kind. The tell is that the three wrong options could all be collected without the claim ever being true, which means none of them could show it false.',
    }
  },
)

interface DistanceCase {
  source: string
  /** Ordered from closest to the data to furthest from it. */
  ladder: string[]
  note: string
}

const DISTANCE_CASES: DistanceCase[] = [
  {
    source: 'A study of a school\'s new later start time',
    ladder: [
      'Registration marks were taken every morning',
      'Lateness fell from 34 a week to 12 a week',
      'The later start accounts for most of that fall',
      'Exam results will improve next summer',
    ],
    note: 'The first line reports the method, the second the reading, the third a conclusion that leans on the reading, and the fourth a claim about something nobody measured at all.',
  },
  {
    source: 'A trial of two fertilisers on a school allotment',
    ladder: [
      'Plants were measured with the same ruler weekly',
      'Bed A grew 6 cm more than bed B over the term',
      'The fertiliser on bed A is the better of the two',
      'This fertiliser would help any garden in the area',
    ],
    note: 'Notice that the third line is a fair conclusion about these two beds and the fourth stretches it to gardens nobody visited.',
  },
  {
    source: 'A survey of how a village hall is used',
    ladder: [
      'Bookings were counted from the hall diary',
      'Evening bookings outnumbered daytime ones three to one',
      'The hall is mainly an evening venue in practice',
      'A daytime café would not find enough customers',
    ],
    note: 'The third line restates the reading as a characterisation, which is a small step. The fourth predicts the behaviour of customers who were never asked.',
  },
  {
    source: 'A test of two ways of revising vocabulary',
    ladder: [
      'Both groups were tested with the same word list',
      'The self-testing group scored 12% higher after a week',
      'Self-testing helped more than re-reading did here',
      'Self-testing is the best way to revise anything',
    ],
    note: 'The move from "here" to "anything" is the one worth spotting. Everything up to the third line is carried by the test; the fourth is carried by enthusiasm.',
  },
  {
    source: 'A report on a new one-way system in a corridor',
    ladder: [
      'Two observers timed the corridor at changeover',
      'The average crossing time fell from 95 to 70 seconds',
      'The one-way system is moving people through faster',
      'Pupils are arriving at lessons in a better mood',
    ],
    note: 'Mood was not measured, mentioned or defined, which is what makes the fourth line speculation rather than a weak conclusion.',
  },
  {
    source: 'A comparison of two bus routes to the same town',
    ladder: [
      'Journeys were timed with a phone on ten trips',
      'Route B averaged four minutes less than route A',
      'Route B is the quicker of the two at that hour',
      'Route B will stay quicker after the roadworks end',
    ],
    note: 'The third line correctly limits itself to the hour that was sampled. The fourth reaches into a future with different road conditions.',
  },
  {
    source: 'A study of noise in a school library',
    ladder: [
      'A meter logged sound levels every ten minutes',
      'Levels after lunch averaged 8 decibels above the morning',
      'The library is noticeably noisier in the afternoons',
      'A quiet zone would fix the afternoon problem',
    ],
    note: 'The fourth line proposes a solution, and proposing a solution is not the same as having evidence that it works.',
  },
  {
    source: 'A record of a chess club\'s results over a term',
    ladder: [
      'Every game result was written into the club book',
      'Members won 61 of 100 games against other clubs',
      'The club is stronger than most of its opponents',
      'The club would do well in the county league',
    ],
    note: 'Sixty-one wins in a hundred supports "stronger than these opponents". A county league contains different opponents, which is why the last line is a guess.',
  },
]

const distanceFromData = tpl(
  {
    id: 'odepth-distance-from-data',
    name: 'Order them by distance from the data',
    skillIds: ['o-claimtype'],
    bucket: 'observer',
    difficulty: 3,
    variants: DISTANCE_CASES.length,
    minutes: 3,
    calibration: true,
  },
  (_rng, seed) => {
    const c = cycle(seed, DISTANCE_CASES)
    const display = scrambledDisplay(c.ladder)
    const correct = c.ladder.map((l) => display.indexOf(l))
    return {
      title: 'From the reading outwards',
      prompt:
        `${c.source} produced these four sentences.\n\nPut them in order, starting with the one CLOSEST to what was actually recorded and ending with the one FURTHEST from it.`,
      answer: { type: 'order', options: display, correct },
      hints: [
        'Find the sentence that describes how the data was collected — that is always closest.',
        'Then the reading itself, then the conclusion that leans on the reading, then the claim nothing measured touches.',
        `Worked path: ${c.ladder.join(' → ')}.`,
      ],
      explanation:
        `Closest to furthest: ${c.ladder.join(' → ')}.\n\n${c.note}\n\n` +
        'Sorting into three boxes tells you what kind each sentence is; ordering them shows you the SHAPE of the piece, which is the part that matters when you are deciding how much of it to believe. A report that travels a long way from one reading is not necessarily wrong — but every step from one sentence to the next is a step somebody took on your behalf, and the further out you go, the more of them there are to check.',
    }
  },
)

export const OBSERVER_DEPTH_TEMPLATES: ItemTemplate[] = [
  // o-obsinf
  ledgerTwo,
  observationSelect,
  reverseObservation,
  stripTheInference,
  howFarBeyond,
  // o-recall
  sceneSequence,
  notEnoughNoticed,
  countAndPlace,
  presentOrPlausible,
  // o-listen
  hedgeUpgrade,
  paraphraseSort,
  saidVersusHeard,
  mirrorThenCheck,
  // o-bias
  fitsEveryone,
  whoSuppliedIt,
  makeItCheckable,
  calibrationGap,
  // o-memory
  lociDelayed,
  chunkedCode,
  linkedStory,
  encodingChoice,
  // o-selection
  responseBounds,
  filterDirection,
  fixTheCollection,
  // o-expect
  nameTheFalsifier,
  countCouldFail,
  riskiestPrediction,
  // o-anchor
  firstImpressionScale,
  rebuildTheNumber,
  whoseNumber,
  // o-frame
  frameFrequency,
  oppositeFrame,
  sameMeasurement,
  // o-claimtype
  countMeasured,
  whatWouldUpgradeIt,
  distanceFromData,
]
