/**
 * Reading situations honestly — four DEFENSIVE skills that all correct the
 * reader's own inference, never the other person.
 *
 *   h-attribution  situation or character, and what evidence separates them
 *   h-projection   assuming everyone sees it the way you do
 *   h-interests    the need underneath a stated demand
 *   h-repair       what an apology has to contain, and what makes it a second hit
 *
 * DIRECTION, AS CONTENT LAW. Everything here is influence defence and
 * self-correction. Nothing teaches reading a person for advantage, extracting
 * anything, or getting a result out of someone. The negotiation items ask their
 * questions OPENLY, in a conversation both sides know they are having, and every
 * "what would you do" key survives the other person watching you choose it. The
 * repair items are explicit that an apology is owed, not deployed, and that the
 * person who was hurt sets the clock. Scenarios stay at ordinary school and
 * family friction on purpose: nothing here needs a serious topic to be real.
 *
 * EVIDENCE, AND ITS LIMITS.
 *
 * - Debiasing education works, modestly. Swaryandini et al. (2025), Nature Human
 *   Behaviour 9(12), 2510-2538: 54 RCTs, 383 effect sizes, 10,941 students,
 *   g = 0.26 [0.14, 0.39] for reduced bias COMMISSION against control. That is
 *   the number to quote — not the much larger pre-post d values from single
 *   studies, which have no untrained control. Morewedge et al. (2015) supplies
 *   the design argument rather than the size (RESEARCH.md §29b): the interactive
 *   game beat the instructional video at not COMMITTING biases while the video
 *   beat the game at NAMING them. So most items here put the bias in the trap
 *   and ask an ordinary question, rather than asking "which bias is this?".
 *
 * - WHAT THE EVIDENCE DOES NOT SUPPORT, recorded deliberately. The one-line
 *   description of this skill — we explain our own behaviour by circumstances
 *   and other people's by character — is the ACTOR-OBSERVER asymmetry, and Malle
 *   (2006, Psychological Bulletin 132(6)) meta-analysed 173 studies and found it
 *   near zero overall (d = -0.016 to 0.095), converging on zero after correcting
 *   for publication bias, and surviving only under narrow moderators
 *   (idiosyncratic actors, intimates, free-response coding). What IS robust is
 *   the CORRESPONDENCE BIAS: over-reading disposition from behaviour even when
 *   the situational constraint is known and stated (Jones & Harris 1967; Gilbert
 *   & Malone 1995). Every h-attr-* item is therefore built as a correspondence
 *   item — a scene, a constraint, and the question of what the evidence
 *   supports — and `h-attr-mirror` treats the double standard as something to
 *   CHECK for rather than a law that always holds.
 *
 * - Consequence for the answer key: it is NOT always "the situation". A bank
 *   where the right answer is forever "you are being unfair to them" trains
 *   compliance, not reading, and would be beatable without the skill.
 *   `h-attr-verdict` derives its key from two covariation questions in the
 *   Kelley tradition — does anyone else do this here, and does this person do it
 *   elsewhere — and returns "the person" or "nothing separates them yet"
 *   whenever those answers say so. `h-attr-groups` includes cases where the
 *   measure itself is broken and neither reading is supported.
 *
 * - h-projection: Ross, Greene & House (1977), Journal of Experimental Social
 *   Psychology 13(3), 279-301 — four studies; people who hold a view estimate a
 *   higher share of others sharing it than people holding the opposite view do.
 *   Scenarios here are original; none of the study's own items are reused.
 *
 * - h-interests: positions-versus-interests is the principled-negotiation frame
 *   (Fisher & Ury). It gets the two-case comparison item because negotiation
 *   training is the domain where analogical comparison was demonstrated:
 *   Gentner, Loewenstein & Thompson (2003), J. Educational Psychology 95(2),
 *   where learners who compared two surface-different cases transferred the
 *   principle two to three times as often as learners who studied the same cases
 *   separately. `h-int-cases` copies the three-checkpoint SHAPE from
 *   `items/caseComparison.ts` — ungraded prompted comparison, graded principle,
 *   graded third case — and none of its scenarios.
 *
 * - h-repair: Lewicki, Polin & Lount (2016), Negotiation and Conflict Management
 *   Research 9(2), 177-196. Six components; apologies carrying more of them were
 *   rated more effective; acknowledgement of responsibility and an offer of
 *   repair rated most important, a request for forgiveness least. The limitation
 *   shapes the copy: participants RATED written apologies in scenarios, so this
 *   is evidence about what reads as a real apology, not about whether a
 *   relationship recovered. `h-rep-rank` therefore states its ranking test in
 *   the prompt instead of asserting a hidden ideal order, and the explanations
 *   say plainly that the words are not the repair.
 *
 * OPTION LENGTH. Every MCQ set is length-balanced deliberately. This bucket is
 * almost entirely prose options, where the correct answer naturally wants a
 * qualifying clause and the distractors naturally come out terse — the exact
 * shape that let a learner score 52.8% bank-wide by always picking the longest
 * option before that was fixed. Distractors here carry the same number of
 * clauses as the key.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { classify, cycle, draft, mcq, multi, numeric, tpl } from '../lib'
import { rint, shuffle, type Rng } from '../../engine/rng'

/** A fixed scene with one key and three same-shape distractors. */
interface Choice {
  scene: string
  correct: string
  wrong: [string, string, string]
  /** Why the most tempting wrong option tempts. Required in every explanation. */
  tempt: string
}

// ===========================================================================
// h-attribution — situation or person?
// ===========================================================================

const ATTR_ENTRY: Choice[] = [
  {
    scene: 'Theo hands in his history sheet a day late.',
    correct: 'The printer died and the library shut at four',
    wrong: [
      'He is disorganised about anything with a deadline',
      'He does not think history is worth much effort',
      'He likes the fuss that a late hand-in causes',
    ],
    tempt: 'The "disorganised" reading tempts because a late sheet is exactly what a disorganised person produces — but it is also exactly what a dead printer produces, and only one of those was actually observed.',
  },
  {
    scene: 'Nina says almost nothing in the group meeting.',
    correct: 'The two loudest members talked for the full hour',
    wrong: [
      'She is shy in any room with more than three people',
      'She had not bothered to read the brief beforehand',
      'She thinks the project is beneath her to discuss',
    ],
    tempt: 'The shyness reading tempts because it explains everything she did and nothing she did not do — it would predict the same silence in a quiet room, which is the version nobody watched.',
  },
  {
    scene: 'Ravi walks straight past you in the corridor.',
    correct: 'The corridor was packed and he faced the other way',
    wrong: [
      'He is the sort of person who walks past people',
      'He has decided the friendship is not worth it',
      'He was making a point about last week',
    ],
    tempt: 'The "decided the friendship is over" reading tempts because it is the one that involves you, and readings that involve you feel more vivid — vividness is a fact about your attention, not about his intentions.',
  },
  {
    scene: 'Mia snaps at her brother about the volume.',
    correct: 'She had slept four hours before an early exam',
    wrong: [
      'She has a short temper with her family',
      'She enjoys being in charge of the house rules',
      'She has never liked the music he plays',
    ],
    tempt: 'The short-temper reading tempts because one snap is enough to feel like a pattern. A pattern needs more than one observation, and four hours of sleep would produce this one on its own.',
  },
  {
    scene: 'Sam forgets to bring the ball to practice.',
    correct: 'The kit bag was still in a car parked at work',
    wrong: [
      'He is careless with anything he is trusted with',
      'He wanted the session cancelled anyway',
      'He does not really care about the team',
    ],
    tempt: 'The "careless" reading tempts because it is the shortest story that covers the facts. Short is not the same as supported: it needs a claim about who he is, where the bag needs only a claim about where it was.',
  },
  {
    scene: 'Priya turns down every invitation this month.',
    correct: 'Exams and a family visit filled every weekend',
    wrong: [
      'She is not interested in the friendship anymore',
      'She prefers her own company to anyone else\'s',
      'She is waiting for a better offer to come along',
    ],
    tempt: 'The "not interested anymore" reading tempts because four refusals in a row look like a decision. They look identical whether the cause is a decision or a full calendar, which is why the count alone cannot separate them.',
  },
  {
    scene: 'A new classmate answers questions in one word.',
    correct: 'It is her third day and she knows nobody yet',
    wrong: [
      'She is unfriendly and does not want to talk',
      'She thinks the class is beneath her level',
      'She is being deliberately mysterious about it',
    ],
    tempt: 'The "unfriendly" reading tempts because short answers feel like a signal about the person. Being three days into a room full of strangers produces short answers in almost anyone.',
  },
  {
    scene: 'Dan cancels on the cinema an hour before.',
    correct: 'His shift was moved and he was told at four',
    wrong: [
      'He treats plans with you as easy to drop',
      'He is unreliable about everything he agrees to',
      'He had a better offer and took it instead',
    ],
    tempt: 'The "better offer" reading tempts because a late cancellation is what a better offer looks like from the outside. It is also what a moved shift looks like, and you can only see the outside.',
  },
  {
    scene: 'A teacher leaves the class no time for questions.',
    correct: 'The fire drill took twenty minutes off the lesson',
    wrong: [
      'He does not like being questioned by students',
      'He has no patience with people who are behind',
      'He wants out of the room as fast as he can',
    ],
    tempt: 'The "does not like being questioned" reading tempts because it explains a run of lessons, not just this one — but this one had twenty minutes removed from it, and that is the only difference you observed.',
  },
  {
    scene: 'Yusuf keeps checking his phone while you talk.',
    correct: 'His sister is late home and he is the one waiting',
    wrong: [
      'He is rude about giving people his attention',
      'He finds the conversation boring but will not say',
      'He would rather be almost anywhere else',
    ],
    tempt: 'The boredom reading tempts because it is about you, and it is the reading that would hurt — feeling like the likely answer is not evidence that it is.',
  },
  {
    scene: 'Ella hands back your book with the cover bent.',
    correct: 'It was in a bag that got crushed on the bus',
    wrong: [
      'She is careless with things that are not hers',
      'She wanted you to know she did not enjoy it',
      'She does not think a book matters very much',
    ],
    tempt: 'The "careless with other people\'s things" reading tempts because the damage is real and visible. Damage tells you what happened to the book, never who decided it.',
  },
  {
    scene: 'Kofi says no to helping with the stall.',
    correct: 'He is already down for two shifts that weekend',
    wrong: [
      'He avoids anything that looks like real work',
      'He does not want to be seen with the group',
      'He is annoyed about not being asked sooner',
    ],
    tempt: 'The "avoids work" reading tempts because a no is a no whatever is behind it. A person who has already said yes twice produces exactly the same no as a person who never says yes at all.',
  },
]

const attrEntry = tpl(
  {
    id: 'h-attr-entry',
    name: 'Circumstance or character?',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 1,
    variants: ATTR_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_ENTRY)
    return {
      title: 'Which kind of explanation is this?',
      prompt: `${c.scene}\n\nFour explanations get offered. Which one points at the **circumstances** rather than at the kind of person they are?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A circumstance is something that HAPPENED — it would have hit anyone standing there. A character reading says what someone IS.',
        'Try each option on a stranger. The ones that need to know the person are the character readings.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}** is the only one about circumstances: it names something that happened, and it would explain the same behaviour in anybody. The other three are claims about what kind of person they are — which may turn out to be true, but nothing in the scene tested them. ${c.tempt}`,
    }
  },
)

// --- sort a whole set of explanations -------------------------------------

interface SortCase {
  scene: string
  /** category 0 = the situation, 1 = the person. Three of each. */
  statements: { text: string; category: number }[]
  note: string
}

const ATTR_SORT: SortCase[] = [
  {
    scene: 'Jo has arrived at the bus stop late four mornings this week.',
    statements: [
      { text: 'The stop moved two streets further away on Monday', category: 0 },
      { text: 'Jo leaves everything until the last possible minute', category: 1 },
      { text: 'Her younger brother now has to be dropped off first', category: 0 },
      { text: 'Jo is not a morning person and never has been', category: 1 },
      { text: 'The earlier bus was cancelled from the start of this week', category: 0 },
      { text: 'Jo does not really think being on time matters', category: 1 },
    ],
    note: 'Notice that the three situational items all landed in the same week the lateness started, and the three character items would have been just as true last month, when Jo was on time. An explanation that was already true before the change cannot explain the change.',
  },
  {
    scene: 'The group project is behind and one member has sent nothing.',
    statements: [
      { text: 'He has been off school with a chest infection', category: 0 },
      { text: 'He lets other people carry him every single time', category: 1 },
      { text: 'Nobody ever told him which section was his', category: 0 },
      { text: 'He is lazy about anything that is not marked alone', category: 1 },
      { text: 'The shared folder was view-only until Friday', category: 0 },
      { text: 'He does not care whether the group does well', category: 1 },
    ],
    note: 'The view-only folder is the one worth checking first, because it is cheap to check and it would explain everything. Character readings are expensive to check and, if wrong, expensive to have said out loud.',
  },
  {
    scene: 'A shop assistant is short with you at the till.',
    statements: [
      { text: 'She has been on since six with no break', category: 0 },
      { text: 'She is rude to customers as a matter of habit', category: 1 },
      { text: 'The card machine has failed twice in ten minutes', category: 0 },
      { text: 'She has no time for people your age', category: 1 },
      { text: 'There are nine people queueing behind you', category: 0 },
      { text: 'She resents having to work in a shop at all', category: 1 },
    ],
    note: 'You will never find out which of these is true, and that is the point: this is a stranger you will see for ninety seconds. The useful habit is not solving it, it is not carrying a verdict about a person out of the shop with you.',
  },
  {
    scene: 'Your friend has not replied to a message for two days.',
    statements: [
      { text: 'Her phone screen cracked on Saturday night', category: 0 },
      { text: 'She replies when it suits her and not before', category: 1 },
      { text: 'She is away where the signal is unreliable', category: 0 },
      { text: 'She is the kind of person who lets things slide', category: 1 },
      { text: 'The message landed under forty others in a group', category: 0 },
      { text: 'She is making a point about last week, quietly', category: 1 },
    ],
    note: 'The last one is the trap in a different costume: it looks like a story about the situation because it mentions last week, but "making a point" is a claim about her intentions, and nothing you can see distinguishes it from a buried message.',
  },
  {
    scene: 'A classmate scored much lower than usual on the test.',
    statements: [
      { text: 'He sat the paper the day after a long flight', category: 0 },
      { text: 'He is not as clever as everyone seems to think', category: 1 },
      { text: 'That topic was taught in the week he was ill', category: 0 },
      { text: 'He has got complacent and stopped working', category: 1 },
      { text: 'His copy was the version with the misprint', category: 0 },
      { text: 'He goes to pieces whenever anything is timed', category: 1 },
    ],
    note: 'One score is one observation. Every character reading here claims a stable property from a single number, which is the same mistake as calling a coin biased after one toss.',
  },
  {
    scene: 'The kitchen was left in a mess after your brother cooked.',
    statements: [
      { text: 'He was called out to collect your mum at eight', category: 0 },
      { text: 'He expects other people to clear up after him', category: 1 },
      { text: 'The dishwasher was mid-cycle and completely full', category: 0 },
      { text: 'He has never once cleaned anything voluntarily', category: 1 },
      { text: 'The bin had been full since the morning', category: 0 },
      { text: 'He does the least he can get away with doing', category: 1 },
    ],
    note: 'Household arguments run on character readings because they are quick to say. They also make the next conversation about who he is, which nobody can concede — a situational complaint ("the bin was full, tell me next time") is the one that can actually be answered.',
  },
  {
    scene: 'A teammate passed the ball away in the last minute.',
    statements: [
      { text: 'Two defenders had closed the shooting angle', category: 0 },
      { text: 'He avoids any moment that carries pressure', category: 1 },
      { text: 'The call from the bench was to hold the ball', category: 0 },
      { text: 'He would rather not be blamed for a miss', category: 1 },
      { text: 'His ankle had been strapped up at half-time', category: 0 },
      { text: 'He does not back himself in front of a crowd', category: 1 },
    ],
    note: 'Sport produces character readings faster than anything else, because the outcome is public and instant. The bench call is checkable in about four seconds and would settle it, which is exactly why it is worth asking before deciding.',
  },
  {
    scene: 'Someone in your class has stopped coming to the club.',
    statements: [
      { text: 'The club moved to the night she works', category: 0 },
      { text: 'She gives up on things as soon as they get hard', category: 1 },
      { text: 'The late bus home was cut in September', category: 0 },
      { text: 'She only joined to put it on a form', category: 1 },
      { text: 'Her exam timetable landed on those weeks', category: 0 },
      { text: 'She never sticks with anything for a whole term', category: 1 },
    ],
    note: 'Every situational item here is about getting there and getting home. Attendance measures access at least as much as it measures enthusiasm, which is why "who stopped coming" is a bad way to find out who cared.',
  },
  {
    scene: 'A parent said no to the sleepover without explaining why.',
    statements: [
      { text: 'The car is off the road until Thursday', category: 0 },
      { text: 'They enjoy saying no more than saying yes', category: 1 },
      { text: 'They had already agreed to host your cousins', category: 0 },
      { text: 'They do not trust you out of the house', category: 1 },
      { text: 'The message reached them an hour beforehand', category: 0 },
      { text: 'They are strict about everything on principle', category: 1 },
    ],
    note: 'An unexplained no invites a character reading, because there is nothing else in the gap to put there. The cheapest fix in the whole skill lives here: ask what the reason was, in a tone that suggests you expect there to be one.',
  },
  {
    scene: 'Your friend gave your idea to the class as though it were hers.',
    statements: [
      { text: 'The teacher put her on the spot in front of everyone', category: 0 },
      { text: 'She takes whatever she can get away with taking', category: 1 },
      { text: 'She had heard you say it in a group of six', category: 0 },
      { text: 'She wanted the credit and did not care whose it was', category: 1 },
      { text: 'There were four seconds left before the bell', category: 0 },
      { text: 'She has always needed to look like the clever one', category: 1 },
    ],
    note: 'This is the case where the character reading might well be right — sorting an explanation as "about the person" does not make it false. What settles it is what she does when you tell her it stung, and that is an observation you have not made yet.',
  },
]

const attrSort = tpl(
  {
    id: 'h-attr-sort',
    name: 'Sort the explanations',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 2,
    variants: ATTR_SORT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_SORT)
    return {
      title: 'Two kinds of explanation',
      prompt: `${c.scene}\n\nSort each explanation. Is it about **the situation** they were in, or about **the person** they are?`,
      answer: classify(rng, ['The situation', 'The person'], c.statements),
      hints: [
        'Situation explanations name something that happened. Person explanations name something that is always true of them.',
        'A useful test: could this sentence have been written last month, before any of this happened? If yes, it is a person explanation.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation: `${c.statements
        .map((s) => `**${['Situation', 'Person'][s.category]}**: ${s.text}`)
        .join('. ')}. ${c.note} Sorting is not deciding: both columns can hold true statements, and the skill is noticing that only one column has been tested.`,
    }
  },
)

// --- the double standard, treated as something to check ------------------

const ATTR_MIRROR: Choice[] = [
  {
    scene: 'You were twenty minutes late to meet Ada last month, because the bus never came. Today Ada is twenty minutes late to meet you, and has not said why.',
    correct: 'You know your reason and not hers — that gap is the difference',
    wrong: [
      'Mine was the bus. Hers is that she does not prioritise me',
      'Being late twice in a month tells you who someone really is',
      'She probably had a reason, but mine was a genuine emergency',
    ],
    tempt: 'The last one is the double standard wearing a generous face: it grants her a reason and then quietly ranks yours above it, on no evidence at all.',
  },
  {
    scene: 'You once left a message unanswered for two days when your week was full. Ben has now left yours unanswered for two days.',
    correct: 'Full weeks happen to Ben too — that was your own reading',
    wrong: [
      'Mine was a busy week. His is that he cannot be bothered',
      'Two days of silence tells you where you stand with someone',
      'He would have replied within an hour if he wanted to',
    ],
    tempt: 'The one-hour claim tempts because it sounds like a measurement. It is a prediction about a version of Ben you invented — and you would not accept it about yourself two days ago.',
  },
  {
    scene: 'You cut a friend off mid-sentence once, because you were nervous and rushing. Today Lea cuts you off mid-sentence.',
    correct: 'Nerves cut you off once, so you cannot rule that out here',
    wrong: [
      'Mine was nerves. Hers is that she talks over people',
      'People who interrupt are showing you their real manners',
      'She did that deliberately, to shut the conversation down',
    ],
    tempt: 'The "real manners" line tempts because it sounds like wisdom about people. It is a rule that would have convicted you last month, when the true cause was nothing to do with manners.',
  },
  {
    scene: 'You skipped a club night once because you were exhausted and said nothing. Omar has now skipped two in a row without explaining.',
    correct: 'Two of yours would have looked the same from outside',
    wrong: [
      'Mine was exhaustion. His is that he has lost interest',
      'Missing twice in a row is how quitting actually starts',
      'He would have told the group if there were a real reason',
    ],
    tempt: 'The "would have told us" test tempts because it feels like a fair standard. Apply it backwards: you did not tell the group either, and your reason was real.',
  },
  {
    scene: 'You once gave a short answer to a friend because you were upset about something else entirely. Kira gives you a short answer today.',
    correct: 'A short answer carried nothing about that friend when it was yours',
    wrong: [
      'Mine was about something else. Hers is about me',
      'The tone people use is the most honest thing about them',
      'She has been off with me since the weekend, so this fits',
    ],
    tempt: 'The last one tempts hardest, because it adds a second observation. Two vague impressions of coldness are not evidence — they are the same reading counted twice.',
  },
  {
    scene: 'You forgot a cousin\'s birthday in a term that went badly. Your cousin has now forgotten yours.',
    correct: 'You forgot one under load, so load explains hers as well',
    wrong: [
      'Mine was a bad term. Hers is that she does not think of me',
      'People remember the birthdays of people who matter to them',
      'She remembered her other cousin\'s, so this one was a choice',
    ],
    tempt: 'The other-cousin comparison is the strongest wrong option because it is a real piece of evidence — but you do not know what else fell in her week, and it is exactly the comparison you would have failed last year.',
  },
  {
    scene: 'You did badly on one test after a bad night. A classmate has just done badly on one test.',
    correct: 'One score meant almost nothing when the score was yours',
    wrong: [
      'Mine was a bad night. His is that he does not work',
      'The test is there precisely to show who has done the work',
      'He was confident beforehand, so he clearly had not revised',
    ],
    tempt: 'The confidence detail tempts because it feels like inside information. Confidence before a test predicts a bad night as easily as it predicts no revision.',
  },
  {
    scene: 'You once said something that came out wrong and you did not mean. Someone has just said something to you that came out wrong.',
    correct: 'Yours came out wrong without meaning it, so theirs might',
    wrong: [
      'Mine came out wrong. Theirs is what they actually think',
      'People say what they mean and then apologise for it',
      'The way they said it was too specific to be an accident',
    ],
    tempt: 'The "too specific to be an accident" reading tempts because precision feels deliberate. Clumsy sentences are often specific — yours was, and it still was not what you meant.',
  },
  {
    scene: 'You once stayed quiet while a friend was being talked about, because you froze. Someone stayed quiet today while it was you.',
    correct: 'Freezing is what it looked like from outside when it was you',
    wrong: [
      'Mine was freezing. Theirs is that they agreed with it',
      'Silence in that moment is a choice, and everyone knows it',
      'They looked away, which means they knew what they were doing',
    ],
    tempt: 'The looking-away detail tempts because it feels like a tell. Looking away is what freezing looks like too — and if that is a fair reading of them, it convicts you of the same thing.',
  },
  {
    scene: 'You broke something you had borrowed and hid it for a day out of embarrassment. Your brother has done the same with your headphones.',
    correct: 'Embarrassment bought you a day, and it can buy him one',
    wrong: [
      'Mine was embarrassment. His is that he was hoping to get away with it',
      'Hiding it for a day is the part that shows what someone is like',
      'He only owned up once he knew that you had already noticed',
    ],
    tempt: 'The timing point is the best wrong option: owning up after being noticed does look worse. It also describes exactly what you did, and you know why you did it.',
  },
]

const attrMirror = tpl(
  {
    id: 'h-attr-mirror',
    name: 'The same standard both ways',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 2,
    variants: ATTR_MIRROR.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_MIRROR)
    return {
      title: 'Same behaviour, two readings',
      prompt: `${c.scene}\n\nWhich reading applies the same standard to both of you?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Write down the explanation you accepted for yourself. Is it still available to them? If it is, it has not been ruled out.',
        'The difference between the two cases is usually information, not character: you were inside your reasons and you are outside theirs.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. You have your reasons from the inside and their behaviour from the outside, so the same act comes with an explanation attached in one case and not the other. That asymmetry is about where you were standing. ${c.tempt} Worth being honest about the size of this: the idea that people always excuse themselves and convict others is weaker than it sounds — a large review of the research found the effect close to zero on average. It is a thing to CHECK for in a specific case, not a law you can assume.`,
    }
  },
)

// --- what one extra fact would separate the readings ----------------------

const ATTR_FACT: Choice[] = [
  {
    scene: 'Priya has been quiet in every lesson this week, and you have decided she is annoyed with you.',
    correct: 'Whether she is just as quiet with the people she sits with',
    wrong: [
      'What she said to you the last time you spoke properly',
      'Whether she looked over at you when you came in on Monday',
      'How many days the quiet has now been going on for',
    ],
    tempt: 'The last conversation tempts because it is the fact you can retrieve fastest — and it will fit whatever story you already have. A fact that confirms every reading separates none of them.',
  },
  {
    scene: 'A teammate has missed three sessions and the group has started calling him lazy.',
    correct: 'Whether he had ever missed a session before this term',
    wrong: [
      'How badly the team needs him for the next match',
      'Whether he said anything in the group chat afterwards',
      'Which three sessions out of the block he actually missed',
    ],
    tempt: 'How badly he is needed tempts because it is what makes the absence feel bad. The cost to you is real and tells you nothing about the cause.',
  },
  {
    scene: 'Your sister has snapped at you twice today and you are ready to say she is impossible.',
    correct: 'Whether she has snapped at anyone else in the house today',
    wrong: [
      'Whether the two snaps were about the same thing',
      'How long it has been since the last argument between you',
      'Whether she apologised for either of them afterwards',
    ],
    tempt: 'Whether she apologised tempts because apologising is what a reasonable person does. It measures what happened after, not what caused it — and plenty of people who were having an awful day do not apologise until later.',
  },
  {
    scene: 'A shop assistant was short with you and you have decided she has a problem with you.',
    correct: 'Whether the queue behind you was already ten people deep',
    wrong: [
      'Whether she was friendlier with the customer in front',
      'How she said it, more than what she actually said',
      'Whether you had done anything to annoy her first',
    ],
    tempt: 'Comparing yourself with the customer in front looks like the right test, and it is nearly one — but that customer arrived a minute earlier, at a different point in her shift, which is the thing the queue length is measuring.',
  },
  {
    scene: 'A classmate did not invite you to the cinema and you have taken it personally.',
    correct: 'Whether anyone outside their own form was invited at all',
    wrong: [
      'How many people ended up going in the end',
      'Whether they knew that you liked that kind of film',
      'How long you have both been in the same classes',
    ],
    tempt: 'The number who went tempts because a bigger group makes being left out feel more deliberate. Group size does not tell you where the boundary was drawn, and the boundary is the whole question.',
  },
  {
    scene: 'A teacher marked you far harder than you expected and you think she has it in for you.',
    correct: 'What the same teacher gave other people for the same work',
    wrong: [
      'How long you personally spent on the piece of work',
      'Whether she has marked you generously before this',
      'What the mark scheme says the top band should contain',
    ],
    tempt: 'Time spent tempts because effort feels like it should convert into marks. It is a fact about you and cannot distinguish a hard marker from an unfair one.',
  },
  {
    scene: 'Your friend forgot to bring the thing you asked for, and you are sure it is because it was for you.',
    correct: 'Whether she also forgot the things she needed herself',
    wrong: [
      'How important you had made it sound when you asked',
      'Whether she has forgotten anything of yours before',
      'How long there was between the asking and the day',
    ],
    tempt: 'How clearly you asked tempts because it feels like the fair question. It changes who is responsible; it does not tell you whether the forgetting was about you, which is the thing you actually believe.',
  },
  {
    scene: 'A group chat went quiet after your message and you have concluded the idea went down badly.',
    correct: 'Whether that chat has been quiet since Thursday anyway',
    wrong: [
      'Whether anyone reacted to the message with an emoji',
      'How long the chat normally takes to answer a question',
      'Whether the people who usually reply were online',
    ],
    tempt: 'Response time tempts because it is measurable and feels like data. Without knowing the chat\'s ordinary silence, a slow reply has no baseline to be slow against.',
  },
  {
    scene: 'Someone took the last free seat you were walking towards and you think they did it on purpose.',
    correct: 'Whether they were facing you when you started walking',
    wrong: [
      'How far away from the seat each of you was standing',
      'Whether they have taken a seat from you before',
      'How quickly they sat down once they got there',
    ],
    tempt: 'Distance tempts because it sounds like it settles who had the claim. It settles a fairness question, not the question you are actually asking, which is whether they could see you at all.',
  },
  {
    scene: 'Your parent said no to the trip immediately and you have decided they never want you to go anywhere.',
    correct: 'Whether they have said no to other things this month too',
    wrong: [
      'How quickly they said it after you finished asking',
      'Whether they asked any questions about the trip first',
      'What they said the last time you asked for something',
    ],
    tempt: 'The speed of the no tempts because a fast answer feels like a pre-made one. Fast answers also come from a known constraint — a diary, a bill, a promise already made to someone else.',
  },
  {
    scene: 'A friend has cancelled on you twice and you are starting to think she is avoiding you.',
    correct: 'Whether both cancellations fell on nights she works',
    wrong: [
      'How much notice she gave you on each occasion',
      'Whether she suggested another day either time',
      'How she worded the message when she cancelled',
    ],
    tempt: 'Whether she suggested another day is a genuinely useful signal about effort — but effort and availability are different things, and a shift pattern would explain both cancellations at once.',
  },
  {
    scene: 'A younger student ignored you when you said hello and you have decided they are rude.',
    correct: 'Whether they wear headphones through that corridor daily',
    wrong: [
      'Whether they said hello to anyone else that morning',
      'How loudly you said it and from how far away',
      'Whether they have spoken to you at any point before',
    ],
    tempt: 'The volume-and-distance question is close to right — it is about whether they could hear. The headphones fact covers hearing AND does it for every day, which turns one awkward morning into a checkable pattern.',
  },
]

const attrFact = tpl(
  {
    id: 'h-attr-onefact',
    name: 'The one fact that would settle it',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 3,
    variants: ATTR_FACT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_FACT)
    return {
      title: 'What would change the reading?',
      prompt: `${c.scene}\n\nYou can learn exactly one more fact. Which one would change the reading the most?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A useful fact is one whose two possible answers point at different explanations. If both answers leave you where you are, the fact is decoration.',
        'The most useful facts are usually comparisons: does this happen with other people, in other places, or on other days?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. Ask what each option would look like under both explanations: if it looks the same either way, learning it changes nothing. This one comes out differently depending on which explanation is true, which is what makes it worth the question. ${c.tempt}`,
    }
  },
)

// --- the covariation verdict, with "not enough yet" as a real answer ------

/**
 * The key is COMPUTED from two questions in the Kelley covariation tradition:
 * does anyone else do this in the same spot, and does this person do it
 * elsewhere. Both known and pointing the same way gives a verdict; anything
 * unknown or mixed gives "nothing separates them yet", which is a real answer
 * roughly a third of the time and must stay reachable.
 */
type Flag = 'yes' | 'no' | 'unknown'

const V_SIT = 'The situation — most people would do that there'
const V_PER = 'The person — it shows up wherever they are'
const V_NONE = 'Nothing separates them yet — both still fit'
const V_IMPACT = 'The person — it landed hard, so it was meant'

function verdictKey(others: Flag, elsewhere: Flag): string {
  if (others === 'yes' && elsewhere === 'no') return V_SIT
  if (others === 'no' && elsewhere === 'yes') return V_PER
  return V_NONE
}

interface VerdictCase {
  scene: string
  evidence: string
  others: Flag
  elsewhere: Flag
  note: string
}

const ATTR_VERDICT: VerdictCase[] = [
  {
    scene: 'Marcus lost his temper in the maths lesson on Tuesday.',
    evidence: 'Four other people snapped in that same lesson, and Marcus has never lost his temper in any of his other classes.',
    others: 'yes',
    elsewhere: 'no',
    note: 'Both answers point outward: the behaviour is common in that room and absent everywhere else. Something about that room is doing the work.',
  },
  {
    scene: 'Dana talks over people in the study group.',
    evidence: 'Nobody else in the group does it, she does it in every session, and people who share her other classes describe the same thing.',
    others: 'no',
    elsewhere: 'yes',
    note: 'This is what a supported character reading actually looks like — and even here it is a reading about a habit, not about how she feels about anyone in the room.',
  },
  {
    scene: 'Ivan has not replied to the group message all day.',
    evidence: 'You do not know whether anyone else has replied either, and you have no idea what his day has looked like.',
    others: 'unknown',
    elsewhere: 'unknown',
    note: 'This is the most common real situation and the hardest answer to sit with. Nothing has been ruled out, so any verdict you reach here came from somewhere other than the evidence.',
  },
  {
    scene: 'The new coach shouted at the defence on Saturday.',
    evidence: 'Two parents on the touchline were shouting at the same decision, and nobody has seen the coach raise his voice at any other match.',
    others: 'yes',
    elsewhere: 'no',
    note: 'A first observation of a stranger is where character readings are cheapest and least justified. The one match you watched was also the match everyone else was shouting at.',
  },
  {
    scene: 'Your friend forgot your birthday this year.',
    evidence: 'She forgot two other people\'s birthdays this year as well, and has never once remembered one without a reminder from somebody.',
    others: 'no',
    elsewhere: 'yes',
    note: 'The evidence does support a reading about her — and notice what it does NOT support. "She forgets birthdays" is not "she does not care about you"; the second one has no evidence at all, and it is the one that would hurt.',
  },
  {
    scene: 'A classmate took the last chair you were heading towards.',
    evidence: 'The room filled in about ten seconds and six other people did exactly the same thing to somebody else.',
    others: 'yes',
    elsewhere: 'no',
    note: 'When almost everyone in a room does the same thing, the room is the explanation. Singling out the one who did it to you is a fact about your viewpoint.',
  },
  {
    scene: 'Your brother did not pass on a phone message.',
    evidence: 'He passes messages on most weeks, this week he had two exams, and you do not know whether anyone told him it mattered.',
    others: 'unknown',
    elsewhere: 'unknown',
    note: 'Two half-facts pointing in opposite directions are not one whole fact. The honest move is to notice that you are about to decide on the strength of irritation.',
  },
  {
    scene: 'A teacher gave your group a lower mark than the other groups.',
    evidence: 'Every group that submitted after the deadline got the same deduction, and she marks the same way in both of her classes.',
    others: 'yes',
    elsewhere: 'no',
    note: 'This is the direction the skill protects you in less often but matters just as much: the reading "she is unfair to us" is the comfortable one, and the evidence does not support it.',
  },
  {
    scene: 'Someone at the club interrupts you constantly.',
    evidence: 'You have watched two sessions where he did it to everyone, including the person running the club, which he has been part of for a year.',
    others: 'no',
    elsewhere: 'yes',
    note: 'Supported, and also freeing: if he does it to everyone, it is not a message about you, which is usually the part that stings.',
  },
  {
    scene: 'Your friend has cancelled plans three times this month.',
    evidence: 'All three fell on nights her shift had been moved, the other people on that rota dropped out too, and she has cancelled nothing else.',
    others: 'yes',
    elsewhere: 'no',
    note: 'Three cancellations feels like a pattern about her. It is a pattern about a rota, and the tell is that it stops exactly where the rota stops.',
  },
]

const attrVerdict = tpl(
  {
    id: 'h-attr-verdict',
    name: 'What does the evidence support?',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 3,
    variants: ATTR_VERDICT.length,
    minutes: 3,
    calibration: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_VERDICT)
    const key = verdictKey(c.others, c.elsewhere)
    const wrong = [V_SIT, V_PER, V_NONE, V_IMPACT].filter((o) => o !== key)
    return {
      title: 'Situation, person, or not yet',
      prompt: `${c.scene}\n\nWhat you know: ${c.evidence}\n\nWhat does the evidence support?`,
      answer: mcq(rng, key, wrong),
      hints: [
        'Two questions do most of the work. Does anyone else do this in the same spot? Does this person do it in other spots?',
        'If either answer is missing, nothing has been separated yet — and "not enough to say" is one of the options here.',
        `Worked path: **${key}**.`,
      ],
      explanation: `**${key}**. ${c.note} The option blaming the person because it landed hard is the one to watch: how much something hurt measures the effect on you, and effects say nothing about causes. A small thing can be deliberate and a large thing can be an accident.`,
    }
  },
)

// --- the same question about groups and numbers (transfer) ----------------

const ATTR_GROUPS: Choice[] = [
  {
    scene: 'A tutor group has the worst attendance in the year, and a teacher says they are simply the least motivated group.',
    correct: 'Their first lesson is the far building, straight after PE',
    wrong: [
      'The group does have a worse attitude than the others',
      'Attendance is the fairest measure of a group\'s motivation',
      'A teacher who knows them will read them better than data',
    ],
    tempt: 'The teacher-knows-them option tempts because familiarity does carry information. It carries the same information every year, including the years the timetable was different — which is why it cannot explain a change the timetable can.',
  },
  {
    scene: 'One branch of a bakery has far worse reviews for slow service than the others, and head office blames the staff there.',
    correct: 'It is the only branch open past eight, when queues triple',
    wrong: [
      'The staff at that branch are slower than at the others',
      'Reviews are the most honest measure of service quality',
      'Head office sees every branch and knows what normal is',
    ],
    tempt: 'Reviews feel honest because they come from customers rather than managers. Honest and comparable are different: those customers queued at a different hour from everyone else\'s customers.',
  },
  {
    scene: 'One bus route collects far more complaints than the rest, and the operator says the drivers on it need retraining.',
    correct: 'It is the only route that crosses the level crossing',
    wrong: [
      'The drivers on that route are worse at keeping to time',
      'Complaint totals are how you find the weakest service',
      'Retraining is cheap, so it is worth doing either way',
    ],
    tempt: 'The cheap-anyway argument tempts because it dodges the disagreement. It also spends the money on the one explanation nobody has tested, and leaves the crossing exactly where it was.',
  },
  {
    scene: 'A class scored much lower on the mock than the parallel class, and the department calls them a weak year.',
    correct: 'Their teacher was on leave for the topic worth half the paper',
    wrong: [
      'That class genuinely is weaker than the parallel one',
      'A mock exam is the cleanest comparison there is',
      'The parallel class must have been given easier teaching',
    ],
    tempt: 'The mock feels like a clean comparison because both classes sat the same paper. Same paper is not same preparation, and the half of the paper they missed is where the whole gap sits.',
  },
  {
    scene: 'Two students have collected the most detentions in the year, and the pastoral note says both have poor attitudes.',
    correct: 'Both have lockers at the far end and lateness is the top reason',
    wrong: [
      'The two of them do have worse attitudes than the rest',
      'Detention counts are how a school spots its problem cases',
      'Two students with the same record must be influencing each other',
    ],
    tempt: 'The mutual-influence reading tempts because two people with the same record looks like a friendship. They also share a corridor, and a shared cause explains a shared record without anyone influencing anyone.',
  },
  {
    scene: 'A year group has the lowest recycling rate in the school, and the head of year says they do not care about it.',
    correct: 'The recycling bins on their floor were removed in September',
    wrong: [
      'That year group cares less about recycling than the others',
      'Recycling rate is a direct measure of how much people care',
      'The other years were given a better assembly on the topic',
    ],
    tempt: 'The better-assembly option tempts because it is also situational, which feels like the safe kind of answer. It is a guess about a cause nobody has checked, where the missing bins are a fact somebody can walk down the corridor and see.',
  },
  {
    scene: 'A report says the chess club cancels more sessions than any other club, and concludes its members are less committed.',
    correct: 'The count includes three clubs that only meet once a term',
    wrong: [
      'Chess club members are less committed than other clubs',
      'Cancellation counts are the right way to rank commitment',
      'The chess club should meet less often, like the others do',
    ],
    tempt: 'The advice to meet less often tempts because it would fix the number. It would fix the number by cancelling fewer sessions out of far fewer sessions, which is the giveaway that the number was never measuring commitment.',
  },
  {
    scene: 'Sales at the school shop dropped in a week when a new person was on the till, and someone says the new person is putting people off.',
    correct: 'Nothing here separates the two explanations yet',
    wrong: [
      'The new person on the till is putting customers off',
      'That week was quieter for reasons nobody has checked',
      'Takings over a week are too small a number to mean anything',
    ],
    tempt: 'The third option tempts because it sounds appropriately cautious about small numbers — but "too small to mean anything" is itself a verdict, and the honest position is that two explanations are still standing and nobody has looked at the second one.',
  },
]

const attrGroups = tpl(
  {
    id: 'h-attr-groups',
    name: 'Reading a number about a group',
    skillIds: ['h-attribution'],
    bucket: 'insight',
    difficulty: 4,
    variants: ATTR_GROUPS.length,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, ATTR_GROUPS)
    return {
      title: 'A number and a verdict',
      prompt: `${c.scene}\n\nWhat does the evidence actually support?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask what would have to be true for the number to come out this way WITHOUT anyone being at fault.',
        'Then ask whether the number counts the same thing for everyone it compares. A count with a different denominator underneath is not a comparison.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. A number attached to a group invites a verdict about the group, and the verdict arrives before anyone checks what the number had to pass through to get there. ${c.tempt}`,
    }
  },
)

// ===========================================================================
// h-projection — assuming they see it as you do
// ===========================================================================

const PROJ_ENTRY: Choice[] = [
  {
    scene: 'You are picking the film for movie night. You love horror; nobody has said what they want.',
    correct: 'Put three options in the chat and ask which one people want',
    wrong: [
      'Pick the horror film — almost everyone likes horror really',
      'Ask the two friends who always agree with your taste',
      'Pick horror and find out from whether anyone complains',
    ],
    tempt: 'Asking the two who always agree tempts because it IS asking — it just asks the part of the room already inside your head, which returns your own answer with a second voice attached.',
  },
  {
    scene: 'You are buying a birthday present for a friend and you have found something you would love yourself.',
    correct: 'Ask her what she would actually use before you buy it',
    wrong: [
      'Buy it — the two of you have pretty similar taste anyway',
      'Ask her best friend to confirm that your idea is a good one',
      'Buy the thing you liked most in the shop this afternoon',
    ],
    tempt: 'Checking with her best friend feels like doing the work. You are asking someone to rate YOUR idea rather than to say what she wants, and people rate a friend\'s idea kindly.',
  },
  {
    scene: 'The group is deciding where to eat and you already know your favourite place.',
    correct: 'Send two or three places and let people say which suits',
    wrong: [
      'Book your favourite — it is objectively the best one nearby',
      'Ask whether anyone objects to your favourite place',
      'Book it, because nobody said anything when you mentioned it',
    ],
    tempt: 'Asking whether anyone objects looks like consultation, but it makes disagreeing a small act of conflict. A question that costs something to answer honestly is a question you will get a polite answer to.',
  },
  {
    scene: 'You are setting the project meeting time and after school suits you perfectly.',
    correct: 'Post two or three slots and see which ones people can do',
    wrong: [
      'Set it after school — that is when everybody is free',
      'Set it and ask people to say if they really cannot come',
      'Ask the person you sit with whether the time is fine',
    ],
    tempt: '"Say if you really cannot come" tempts because it sounds accommodating. The word "really" quietly raises the bar for admitting a clash, so the clashes stay hidden until the day.',
  },
  {
    scene: 'You are in charge of music in the shared room and you have a playlist you love.',
    correct: 'Ask what people want on, and check again if it changes',
    wrong: [
      'Put yours on — it is the least annoying music there is',
      'Put yours on quietly, so it cannot really bother anyone',
      'Ask whether anybody actively hates your playlist',
    ],
    tempt: 'Playing it quietly tempts because it seems like a compromise. It reduces the volume of a choice you made alone; nobody was asked at either volume.',
  },
  {
    scene: 'You are writing the club poster and you find one particular joke very funny.',
    correct: 'Show two versions to people outside the club and compare',
    wrong: [
      'Use the joke — anyone with a sense of humour will get it',
      'Show it to your own club and see whether they laugh',
      'Use it, and change it later if nobody signs up at all',
    ],
    tempt: 'Testing on your own club tempts because it is a real audience giving real reactions. It is the audience that already shares your references, which is the one property the poster needs to work without.',
  },
  {
    scene: 'The shared study room is too warm for you and the window is shut.',
    correct: 'Say you are too warm and ask how the others find it',
    wrong: [
      'Open it — a room this warm is uncomfortable for everyone',
      'Open it quietly and see whether anyone gets up to shut it',
      'Ask whether anyone would mind if you opened the window',
    ],
    tempt: 'Asking whether anyone would mind sounds identical to asking how they find it, but it is not: one invites information, the other invites permission, and permission is what people give to avoid a fuss.',
  },
  {
    scene: 'You are ordering the group presentation and you would hate to go first.',
    correct: 'Ask whether anyone has a preference about going first',
    wrong: [
      'Put yourself last — nobody wants to go first anyway',
      'Volunteer someone confident, since they will not mind',
      'Draw lots, because that saves an awkward conversation',
    ],
    tempt: 'Drawing lots tempts because it is visibly fair. It is fair about a thing people care about unequally, so it throws away the chance that someone actively wanted to go first.',
  },
  {
    scene: 'You are planning your younger sibling\'s birthday and you would want a big day out.',
    correct: 'Offer him two or three shapes for the day and let him choose',
    wrong: [
      'Plan the big day out — every kid wants that at his age',
      'Plan it and keep it a surprise so he cannot say no',
      'Ask your parents what they think he would enjoy most',
    ],
    tempt: 'Asking your parents tempts because they know him well. Second-hand knowledge of a preference is still second-hand, and he is standing right there.',
  },
  {
    scene: 'You are setting the team warm-up and a long run is what gets you ready.',
    correct: 'Ask what people need before a match and build from that',
    wrong: [
      'Run first — everybody needs the same warm-up before a match',
      'Run first and let anyone with an injury sit it out',
      'Ask the captain whether the running plan sounds right',
    ],
    tempt: 'The injury exemption tempts because it sounds considerate. It treats one narrow reason as the only legitimate difference, which leaves every other difference unsayable.',
  },
  {
    scene: 'The bake sale money can go to one of four causes, and one matters a lot to you.',
    correct: 'Put all four to a vote before any of them get printed',
    wrong: [
      'Choose yours — nobody could really argue against that one',
      'Choose yours and mention the others were considered too',
      'Ask your friends which of the four they would pick',
    ],
    tempt: 'Asking your friends tempts because it is a poll, and polls feel objective. Your friends were selected by how much they resemble you, so the poll measures your own view more precisely than it measures the year\'s.',
  },
  {
    scene: 'A friend is staying over and you are cooking. You eat anything.',
    correct: 'Ask what she does not eat before you plan the meal',
    wrong: [
      'Cook your best dish — it is the sort of thing anyone likes',
      'Cook it and have something plain ready in case she does not',
      'Ask whether she is fussy about food before she arrives',
    ],
    tempt: 'A backup dish tempts because it looks like preparation. It moves the problem to the moment she has to refuse food in front of you, which is exactly the moment people say they are fine.',
  },
]

const projEntry = tpl(
  {
    id: 'h-proj-entry',
    name: 'Check, do not assume',
    skillIds: ['h-projection'],
    bucket: 'insight',
    difficulty: 1,
    variants: PROJ_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, PROJ_ENTRY)
    return {
      title: 'Find out, or assume?',
      prompt: `${c.scene}\n\nWhich move actually finds out what other people want?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Two of these ask a question. Ask yourself who is being asked, and whether the question makes disagreeing easy or awkward.',
        'A real check can come back with an answer you did not want. If no answer could surprise you, nothing was checked.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. Your own preference arrives with a feeling of obviousness attached, and that feeling is produced by knowing your own reasons — not by other people sharing them. ${c.tempt}`,
    }
  },
)

// --- computing the gap between an assumed rate and a real one -------------

interface GapScene {
  who: string
  lead: string
  group: string
  option: string
}

const GAP_SCENES: GapScene[] = [
  {
    who: 'Nadia',
    lead: 'Nadia would much rather the class trip ran on a Saturday than a Sunday.',
    group: 'the class',
    option: 'Saturday',
  },
  {
    who: 'Owen',
    lead: 'Owen thinks the project should be handed in as a video instead of slides.',
    group: 'the year',
    option: 'the video',
  },
  {
    who: 'Leah',
    lead: 'Leah wants the club night moved from Wednesday to Thursday.',
    group: 'the members',
    option: 'Thursday',
  },
  {
    who: 'Sanjay',
    lead: 'Sanjay would rather the team meal was pizza than sandwiches.',
    group: 'the squad',
    option: 'pizza',
  },
  {
    who: 'Bea',
    lead: 'Bea prefers the darker of the two kit colours on offer.',
    group: 'the team',
    option: 'the darker kit',
  },
  {
    who: 'Tom',
    lead: 'Tom would rather the revision session ran before school than after it.',
    group: 'his class',
    option: 'the early slot',
  },
]

const projGap = tpl(
  {
    id: 'h-proj-gap',
    name: 'How far off was the guess?',
    skillIds: ['h-projection'],
    bucket: 'insight',
    difficulty: 2,
    variants: 12,
    minutes: 3,
  },
  (rng, seed) => {
    const s = cycle(seed, GAP_SCENES)
    const n = [20, 25, 50][rint(rng, 0, 2)]
    const step = 100 / n
    const actual = step * rint(rng, Math.ceil(24 / step), Math.floor(56 / step))
    const k = (actual * n) / 100
    const gap = 5 * rint(rng, 3, 8)
    const guess = actual + gap
    return {
      title: 'The guess and the count',
      prompt: `${s.lead}\n\nAsked to guess, ${s.who} says about **${guess}%** of ${s.group} would pick ${s.option} as well.\n\nThen the real count arrives: **${k} of ${n}** picked ${s.option}.\n\nBy how many percentage points was the guess above the real figure?`,
      answer: numeric(gap, { unit: 'percentage points' }),
      hints: [
        `Turn the count into a percentage first: ${k} out of ${n}.`,
        'Then subtract. A gap in percentage points is just one percentage minus the other — no dividing.',
        `Worked path: ${k} of ${n} is ${actual}%, and ${guess} − ${actual} = **${gap}** percentage points.`,
      ],
      explanation: `${k} out of ${n} is ${actual}%, so the guess of ${guess}% was **${gap} percentage points** too high. The pattern behind it is well replicated: people who hold a view estimate that more others share it than people holding the opposite view estimate (Ross, Greene & House, 1977). Both sides cannot be right, so at least one estimate is being pulled by the estimator's own preference. Note what this does NOT say — it does not say ${s.who} is unusually self-centred, or that the true figure is always lower than a guess. It says an estimate made from inside your own head is not evidence, and that a count exists.`,
    }
  },
)

// --- the plan that only works if everyone is you --------------------------

const PROJ_PLAN: Choice[] = [
  {
    scene: 'Ren loves surprises and is organising a party for a friend who hates being the centre of attention. The plan: forty people hidden in the dark, then the lights on.',
    correct: 'It assumes the friend enjoys surprises the way Ren does',
    wrong: [
      'It assumes forty people can stay quiet for long enough',
      'It assumes the room can be booked for that whole evening',
      'It assumes everyone arrives before the friend gets there',
    ],
    tempt: 'The three logistics risks are all real, and that is what makes them tempting — they are the ones a careful planner would list. They are also the ones that fail loudly and get fixed. The preference assumption fails silently, on the night, in front of everybody.',
  },
  {
    scene: 'Sam works best at six in the morning and has built the group revision timetable around early sessions.',
    correct: 'It assumes the others focus best at the hour Sam does',
    wrong: [
      'It assumes the library is open early enough on Sundays',
      'It assumes everyone has finished the reading beforehand',
      'It assumes the group can agree on one shared timetable',
    ],
    tempt: 'Agreeing on one timetable sounds like the deep problem, and it is a real one. It is downstream of this: the disagreement will be ABOUT the hour, and the hour was chosen from one person\'s body clock.',
  },
  {
    scene: 'A club captain plans a taster session that opens with everyone speaking in front of the room, because that is the part that hooked her.',
    correct: 'It assumes newcomers are hooked by the thing she was',
    wrong: [
      'It assumes enough new people turn up to fill the room',
      'It assumes the session can run for the full hour booked',
      'It assumes the room has space for everyone to stand up',
    ],
    tempt: 'Turnout is the risk she will worry about, because it is the one she can count. The people most put off by opening with public speaking are precisely the ones who will not be there to be counted.',
  },
  {
    scene: 'A fundraiser is planned around scanning a code to donate, by someone whose phone is always charged and online.',
    correct: 'It assumes everyone arrives with a phone that can scan',
    wrong: [
      'It assumes people will donate more than they would in cash',
      'It assumes the code still works on the day of the event',
      'It assumes the stall is somewhere people actually walk past',
    ],
    tempt: 'Whether the code works is the risk that gets tested, because it can be tested. Whether everyone is carrying a working, connected phone is the assumption that gets skipped, because for the planner it has always been true.',
  },
  {
    scene: 'The group chat plan is "no need to confirm, just turn up", written by someone who checks messages every hour.',
    correct: 'It assumes everyone reads the chat as often as the writer',
    wrong: [
      'It assumes nobody needs a reminder closer to the day',
      'It assumes the plan will not change between now and then',
      'It assumes people can find the place without directions',
    ],
    tempt: 'Reminders sound like the same problem, and they nearly are — but a reminder still has to be READ, so it inherits the same assumption rather than fixing it.',
  },
  {
    scene: 'Everyone is asked to put in fifteen pounds for a leaving gift, proposed by someone for whom fifteen pounds is nothing this week.',
    correct: 'It assumes fifteen pounds is a small amount for everyone',
    wrong: [
      'It assumes everyone will remember to hand the money over',
      'It assumes the gift can be bought for what is collected',
      'It assumes people want to give a gift as a whole group',
    ],
    tempt: 'People forgetting to pay is the visible failure and the one the organiser will plan for. The person for whom fifteen pounds is a real decision will not appear as a failure at all — they will just quietly say they are busy that week.',
  },
  {
    scene: 'A study group rule says nobody may ask questions until the end, written by someone who thinks best in silence.',
    correct: 'It assumes everyone thinks best the way the writer does',
    wrong: [
      'It assumes the session has time left at the end for questions',
      'It assumes people can remember questions for a whole hour',
      'It assumes one person is willing to talk for that long',
    ],
    tempt: 'Remembering questions for an hour is a genuine cost and the closest wrong answer. It is a symptom of the rule; the rule itself came from treating one working style as the neutral default.',
  },
  {
    scene: 'The team warm-up is a long run, designed by the one person on the squad who enjoys running as a warm-up.',
    correct: 'It assumes a long run readies everyone as it readies him',
    wrong: [
      'It assumes there is space to run near the pitch',
      'It assumes the warm-up fits in the time before kick-off',
      'It assumes everyone can run for that long without stopping',
    ],
    tempt: 'The stamina objection is close, and it is the one people will voice, because "I cannot" is easier to say than "this does not work for me". The assumption underneath is that being ready has one shape.',
  },
  {
    scene: 'A birthday is planned as a full day out with no gaps, by someone who finds unfilled time boring.',
    correct: 'It assumes the day\'s guest of honour dislikes gaps too',
    wrong: [
      'It assumes the travel between the parts will run to time',
      'It assumes everyone can afford a whole day of activities',
      'It assumes the weather holds for the outdoor half of it',
    ],
    tempt: 'Cost is a strong wrong answer, because it is also a projection of the planner\'s circumstances. It is not the assumption the plan is BUILT on, though: the shape of the day came from one person\'s idea of what an empty hour feels like.',
  },
  {
    scene: 'A poster campaign for the whole year group is written entirely in the humour the writer and her two friends find funny.',
    correct: 'It assumes the year shares the writer\'s sense of humour',
    wrong: [
      'It assumes people stop long enough to read a whole poster',
      'It assumes there is budget to print in enough places',
      'It assumes the posters stay up for more than a few days',
    ],
    tempt: 'Whether anyone stops to read is the risk that gets discussed in every poster meeting. It applies equally to any poster; the humour assumption is the one that makes THIS poster land differently for the writer than for its audience.',
  },
]

const projPlan = tpl(
  {
    id: 'h-proj-plan',
    name: 'The plan that assumes everyone is you',
    skillIds: ['h-projection'],
    bucket: 'insight',
    difficulty: 3,
    variants: PROJ_PLAN.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, PROJ_PLAN)
    return {
      title: 'Find the hidden assumption',
      prompt: `${c.scene}\n\nEvery option below names a real assumption in the plan. Which one is the assumption that the plan cannot survive being wrong about?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Sort the assumptions into two piles: ones about logistics, and ones about what other people are like inside.',
        'Logistics failures announce themselves and get fixed. Preference failures show up as people quietly not coming.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.tempt} The general shape: a plan built from one person's preferences works perfectly in that person's head, because the simulation runs on their own settings. The fix is not more careful planning — it is one question asked of the people the plan is for.`,
    }
  },
)

// --- which moves actually test the assumption -----------------------------

interface CheckCase {
  scene: string
  tests: string[]
  fakes: string[]
  note: string
}

const PROJ_CHECK: CheckCase[] = [
  {
    scene: 'You are convinced the club would be better with the meeting moved to Friday.',
    tests: [
      'Put both nights on a form everyone fills in',
      'Check how many came on Fridays last term',
      'Ask three people who never come why they do not',
    ],
    fakes: [
      'Think it through again more carefully on your own',
      'Ask the two people who suggested Friday to you',
      'Announce Friday and see whether anyone objects',
    ],
    note: 'Asking the people who already agree, and waiting for objections, both return the answer you started with. The three who never come are the most informative people to ask and the ones least likely to be asked.',
  },
  {
    scene: 'You think nobody in the group actually wants to do the presentation as a role-play.',
    tests: [
      'Ask each person separately what they would prefer',
      'Offer both formats and count who picks which',
      'Ask what they each did for the last presentation',
    ],
    fakes: [
      'Say "nobody wants to do a role-play, right?" to the group',
      'Decide from how the group reacted when it was suggested',
      'Go with the safe option, since that offends nobody',
    ],
    note: 'A question that states the expected answer collects agreement, not information. Reading the room from a single reaction is the same problem in a faster form.',
  },
  {
    scene: 'You are sure the year group would sign up for a quiz night rather than a talent show.',
    tests: [
      'Run a sign-up sheet for both and compare the numbers',
      'Look at what filled up fastest in previous years',
      'Ask a form group you have nothing in common with',
    ],
    fakes: [
      'Ask your own form, since they are a good sample of the year',
      'Ask people whether a quiz night sounds good to them',
      'Judge it from how loud people were about the last one',
    ],
    note: 'Your own form is not a small copy of the year — it is the group most selected for resembling you. Loudness measures who is loud.',
  },
  {
    scene: 'You believe your friend would rather have a quiet birthday than a party.',
    tests: [
      'Ask her directly what she would like this year',
      'Ask what she actually enjoyed about last year',
      'Offer two plans and let her pick one of them',
    ],
    fakes: [
      'Work it out from how she behaved at your party',
      'Ask her brother what he thinks she would want',
      'Plan the quiet one, which is the safer guess',
    ],
    note: 'How she behaved at YOUR party is real evidence about that party. Second-hand reports and safe guesses both replace her answer with somebody else\'s.',
  },
  {
    scene: 'You are certain the team would prefer training earlier so the evening is free.',
    tests: [
      'Put both times to the squad and count the answers',
      'Check attendance for the two times last season',
      'Ask the players who miss training most often',
    ],
    fakes: [
      'Ask the players you travel with on the way home',
      'Ask whether anyone minds moving training earlier',
      'Move it and watch whether numbers go up or down',
    ],
    note: 'Moving it and watching does eventually produce data, but it costs a term and confuses two changes at once. "Does anyone mind" invites permission rather than preference.',
  },
  {
    scene: 'You think the shared room is too cold for everyone, not just for you.',
    tests: [
      'Say you are cold and ask how the others find it',
      'Check whether anyone else has a jumper on',
      'Ask what temperature the room was set to before',
    ],
    fakes: [
      'Turn the heating up and see if anyone turns it down',
      'Ask "it is freezing in here, isn\'t it?" to the room',
      'Assume it is fine because nobody has complained',
    ],
    note: 'The tag question at the end is the giveaway: it names the answer you want before anyone speaks. Nobody complaining is the weakest evidence in the list, because complaining has a cost.',
  },
  {
    scene: 'You are sure everyone finds the new sign-up form annoyingly long.',
    tests: [
      'Compare how many started it with how many finished',
      'Ask two people to fill it in while you watch',
      'Check whether sign-ups dropped when it got longer',
    ],
    fakes: [
      'Fill it in yourself again and time how long it takes',
      'Ask people whether they found the form too long',
      'Shorten it anyway, since shorter cannot hurt',
    ],
    note: 'Timing yourself measures you. Asking whether it was too long, after the fact, asks people to agree with a complaint. The drop-off between started and finished is the only number here that nobody is performing for.',
  },
  {
    scene: 'You assume the group chat has gone quiet because people lost interest in the plan.',
    tests: [
      'Check how quiet the chat has been on other weeks',
      'Ask one person directly whether they are still in',
      'Count how many opened the poll without answering',
    ],
    fakes: [
      'Reread your own message looking for what went wrong',
      'Post "I guess nobody is interested then" and see',
      'Take the silence as the answer and cancel the plan',
    ],
    note: 'Rereading your own message keeps the search inside your own head, where the theory came from. The passive-aggressive post does get replies — replies about your feelings, not about the plan.',
  },
]

const projCheck = tpl(
  {
    id: 'h-proj-check',
    name: 'Which moves actually test it?',
    skillIds: ['h-projection'],
    bucket: 'insight',
    difficulty: 3,
    variants: PROJ_CHECK.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, PROJ_CHECK)
    return {
      title: 'Test it, or confirm it?',
      prompt: `${c.scene}\n\nSelect **every** move that could genuinely come back and tell you that you were wrong.`,
      answer: multi(rng, c.tests, c.fakes),
      hints: [
        'For each move, ask what it would look like if your belief were false. If it looks the same either way, it is not a test.',
        'Watch out for questions that contain their own answer, and for asking the people most like you.',
        'Worked path: the three real tests are named in the explanation.',
      ],
      explanation: `The real tests are: ${c.tests.join('; ')}. ${c.note} What unites the ones that fail is that they cannot produce a surprise: a question phrased to agree with you, a sample chosen for resembling you, or silence read as consent. The whole point of checking is to make being wrong possible.`,
    }
  },
)

// --- reading a result as though your circle were the room (transfer) ------

const PROJ_TRANSFER: Choice[] = [
  {
    scene: 'You ran a poll in your own group chat about moving club night. Nine of eleven said yes, and you have reported that most members want the move.',
    correct: 'The eleven asked are the members most similar to you',
    wrong: [
      'Eleven answers is too few to describe a whole club',
      'The poll should have offered more than yes and no',
      'The result needs checking again nearer the actual date',
    ],
    tempt: 'Sample size is the objection that comes to mind first, and it is not wrong — it is just not fatal. Asking a hundred people from the same chat would produce a tighter number and the same error, which is how you can tell size was never the problem.',
  },
  {
    scene: 'A new game gets nine-out-of-ten reviews everywhere you look, so you tell everyone it is the best thing out this year.',
    correct: 'Reviews come from the people who chose to buy it',
    wrong: [
      'Reviews are written too soon after release to be reliable',
      'Ten-point scores are too coarse to compare games with',
      'You have only looked at sites that cover this genre',
    ],
    tempt: 'Only reading genre sites is a real narrowing and the closest wrong answer. It is one layer above the deeper one: even a perfectly balanced set of sites would be reporting the verdicts of people who already wanted the game.',
  },
  {
    scene: 'You find the club\'s new poster hilarious, so you predict a big jump in sign-ups this term.',
    correct: 'You are inside the joke, and the new people are not',
    wrong: [
      'Posters have never been the main reason people sign up',
      'The poster went up too late in the term to help much',
      'One poster cannot be expected to change numbers by much',
    ],
    tempt: 'The "posters do not drive sign-ups" objection is probably true in general and is genuinely tempting. It answers a different question: it says the poster does not matter, where the actual error is predicting a stranger\'s reaction from your own.',
  },
  {
    scene: 'Nobody argued when you proposed the plan in the meeting, so you have written it up as agreed by the group.',
    correct: 'Disagreeing out loud costs more than staying quiet',
    wrong: [
      'Not everyone who mattered was in the room that day',
      'The proposal was too complicated to judge on the spot',
      'The meeting ran late, so people wanted it to end',
    ],
    tempt: 'The meeting running late is a real and very common cause of fake agreement, which is what makes it tempting. It is a special case of the same thing: silence is cheap and disagreement is expensive, and the lateness only raises the price.',
  },
  {
    scene: 'You would never fill in a form that takes ten minutes, so you have cut the club\'s sign-up form down to three questions.',
    correct: 'Your own patience was the only evidence used',
    wrong: [
      'Three questions may not collect what the club needs',
      'The form was never actually tested on any newcomers',
      'Shorter forms attract people who are less committed',
    ],
    tempt: 'The second option is nearly the same point and hard to separate: never testing it IS the mechanism. The first names why it was never tested — the decision already felt evidenced, because it was evidenced, by one person.',
  },
  {
    scene: 'Six people have complained about the new lunch queue system, and you conclude the school hates it.',
    correct: 'People who are content do not join a complaint list',
    wrong: [
      'Six is a small number next to a whole school roll',
      'The complaints may all have come from one form group',
      'Nobody has asked whether the queue is actually faster',
    ],
    tempt: 'Six against a whole school is a real proportion argument. It still treats the six as a sample of everyone, when they are a sample of the people motivated enough to write something down.',
  },
  {
    scene: 'You loved the trip last year and assume the group will vote for the same one again.',
    correct: 'What you enjoyed is being used as the group\'s reason',
    wrong: [
      'Last year\'s group is not the same as this year\'s group',
      'The trip has probably become more expensive since then',
      'Repeating a trip is less exciting the second time round',
    ],
    tempt: 'Different people this year is a strong objection and very nearly the right one. It says your DATA is out of date; the deeper error is that your data was one person\'s enjoyment being read as the group\'s.',
  },
  {
    scene: 'Everyone you have spoken to says the new timetable is worse, so you tell the head of year it is universally unpopular.',
    correct: 'The people who talk to you about it are your friends',
    wrong: [
      'Nobody has defined what "worse" means in this context',
      'People complain about any timetable in the first weeks',
      'The head of year will want numbers rather than opinions',
    ],
    tempt: '"People complain about any change" is a genuinely useful piece of scepticism, and it is the option a thoughtful reader reaches for. It explains why the complaints might be temporary; it does not explain why you only heard from one part of the year.',
  },
]

const projTransfer = tpl(
  {
    id: 'h-proj-transfer',
    name: 'Reading your own circle as the room',
    skillIds: ['h-projection'],
    bucket: 'insight',
    difficulty: 4,
    variants: PROJ_TRANSFER.length,
    minutes: 3.5,
    transfer: true,
  },
  (rng, seed) => {
    const c = cycle(seed, PROJ_TRANSFER)
    return {
      title: 'What is wrong with the conclusion?',
      prompt: `${c.scene}\n\nEvery option below is a fair criticism. Which one is the reason the conclusion does not follow?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask who ended up in the evidence, and what had to be true about a person for them to get there.',
        'Then ask whether collecting more of the same kind of evidence would fix it. If it would not, you have found the real problem.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.tempt} The test that separates them: would ten times as much of this evidence fix the conclusion? When the answer is no, the problem is in who the evidence came from, not how much of it there is.`,
    }
  },
)

// ===========================================================================
// h-interests — the interest under the position
// ===========================================================================

const INT_ENTRY: Choice[] = [
  {
    scene: 'Your sister demands the bedroom light off at nine. She swims at six every morning.',
    correct: 'She needs to be asleep early enough to get up at six without feeling wrecked',
    wrong: [
      'She wants to be the one who decides what happens in that room',
      'She wants you to stop reading in the evenings, which she has said before',
      'She thinks leaving a light on that late is a waste of electricity',
    ],
    tempt: 'The second option is the demand said again in different words — the most common wrong answer in this whole skill, because restating a position feels like explaining it.',
  },
  {
    scene: 'A teammate demands to take every free kick. He was dropped last season and wants back in the starting eleven.',
    correct: 'He needs a visible reason for the coach to pick him ahead of the others',
    wrong: [
      'He wants to be the person who takes the free kicks, which is what he said',
      'He believes he is straightforwardly the best free-kick taker at the club',
      'He is trying to push somebody else out of the position he used to have',
    ],
    tempt: 'The "he thinks he is best" reading tempts because it is what taking every free kick would mean if nothing else were going on. Something else is going on, and it is in the second sentence.',
  },
  {
    scene: 'Your friend demands you stop sitting with the other group at lunch. She joined this term and knows almost nobody else.',
    correct: 'She needs to not be on her own at lunch every day for the rest of term',
    wrong: [
      'She wants you to sit only with her, which is exactly what she asked for',
      'She has decided that she does not like the other group of people',
      'She is testing whether you will choose her over everybody else',
    ],
    tempt: 'The loyalty-test reading tempts because the demand feels controlling, and controlling demands usually come from somewhere. Here the somewhere is stated: she has nowhere else to sit.',
  },
  {
    scene: 'A club member demands the meeting moves to Friday. Their bus home leaves at five on a Thursday.',
    correct: 'They need to be able to get home after the meeting without a long wait',
    wrong: [
      'They want the meeting on a Friday, which is what they have asked for twice now',
      'They would rather not give up a Thursday evening for the club',
      'They are trying to make the meeting inconvenient for other people',
    ],
    tempt: 'The "would rather not give up Thursday" reading is plausible and untestable. The bus time is a fact, and it produces the same demand without anyone having to want anything.',
  },
  {
    scene: 'A group partner demands to write the whole report alone. The last three group reports she was in lost marks for reading like four different essays.',
    correct: 'She needs the finished piece to hold together as one rather than read as parts',
    wrong: [
      'She wants to write the report by herself, which is what she has demanded',
      'She does not trust anyone else in the group to do a decent job',
      'She wants all of the credit for the report to end up with her',
    ],
    tempt: 'The distrust reading tempts because refusing help usually means distrust. It also predicts she would refuse help on anything, and what she refused was shared writing on a mark scheme that punishes exactly that.',
  },
  {
    scene: 'A neighbour demands you stop practising drums after six. Their shift starts at five in the morning.',
    correct: 'They need to be able to sleep in the early evening before a night shift',
    wrong: [
      'They want the drumming to stop after six o\'clock, which is their request',
      'They dislike the drums and would prefer they were never played at all',
      'They are annoyed about something else and this is how it comes out',
    ],
    tempt: 'The "annoyed about something else" reading tempts because complaints often are displaced. Displacement is a guess about a stranger\'s inner life when a five in the morning alarm is sitting there explaining it.',
  },
  {
    scene: 'A friend demands you delete the photo. It was taken on the afternoon she cried about her results.',
    correct: 'She needs the worst hour of her term not to be on show in front of everyone',
    wrong: [
      'She wants that particular photo deleted, which is what she has asked you for',
      'She does not like the way that she happens to look in the picture',
      'She is worried about who else you might have already sent it to',
    ],
    tempt: 'The "who else has it" reading tempts because it is a real worry and would explain urgency. It is a second interest that may well exist, but the one the scene evidences is what the photo is OF.',
  },
  {
    scene: 'A teacher demands every phone goes in the box at the door. Two lessons this month were derailed by a video going round.',
    correct: 'She needs the lesson to run without being derailed halfway through',
    wrong: [
      'She wants the phones in the box, which is the instruction she gave the class',
      'She does not trust this class as far as she can throw them',
      'She has been told by somebody senior that she has to do it',
    ],
    tempt: 'The "she was told to" reading tempts because school rules often do come from above. The two derailed lessons are the evidence actually present, and they point at a need the class could meet another way.',
  },
  {
    scene: 'Your brother demands the controller for the next two hours. His friends are only online until eight.',
    correct: 'He needs to play while his friends are still on and not after they have gone',
    wrong: [
      'He wants two hours on the console, which is precisely what he asked for',
      'He thinks he should get more time on it than you do in general',
      'He is trying to stop you playing the game that you started earlier',
    ],
    tempt: 'The fairness reading tempts because console arguments usually are about shares. This one has a deadline in it, which is why two hours now is worth more to him than three hours later.',
  },
  {
    scene: 'A stallholder demands the pitch by the entrance. Their stall sells to people walking past; the others take orders in advance.',
    correct: 'They need passing traffic in order to sell anything',
    wrong: [
      'They want the pitch by the entrance, which is the one they have asked for',
      'They think their stall deserves the best spot at the whole fair',
      'They want to be somewhere they can pack up and leave early',
    ],
    tempt: 'The "thinks they deserve it" reading tempts because demanding the best spot sounds like status. The sentence after says their sales model needs footfall and the others\' does not, which turns a status claim into a plain requirement.',
  },
  {
    scene: 'A classmate demands to swap seats with you. He cannot read the board from the back row.',
    correct: 'He needs to be able to see what is on the board from where he is sitting',
    wrong: [
      'He wants your seat specifically, which is what he came over and asked for',
      'He would rather sit near the front where the teacher notices him',
      'He wants to sit next to the people who are sitting around you',
    ],
    tempt: 'The "wants to sit near his friends" reading tempts because that is why people usually want to move. It is also the reading that makes the request feel like a favour, when the stated reason makes it a requirement.',
  },
  {
    scene: 'A parent demands your phone stays downstairs overnight. Your grades dropped last term and nobody has talked about it since.',
    correct: 'They need to see that the drop is being dealt with rather than waved away',
    wrong: [
      'They want the phone downstairs at night, which is the rule they announced',
      'They think you are doing something on it that you should not be doing',
      'They want to feel that they are still in charge of how the house runs',
    ],
    tempt: 'The "they think I am up to something" reading tempts because that is what a phone rule feels like from the inside. It also predicts a rule that arrived on its own, and this one arrived after a report.',
  },
]

const intEntry = tpl(
  {
    id: 'h-int-entry',
    name: 'What is the demand for?',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 2,
    variants: INT_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, INT_ENTRY)
    return {
      title: 'Under the demand',
      prompt: `${c.scene}\n\nA demand is one way of meeting a need. What is the need underneath this one?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A position is WHAT someone asks for. An interest is what they would still have if the answer were no.',
        'One of these options is the demand said again in different words. That is never the interest.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. A demand names one route to a need, and it is usually the first route the person thought of. Finding the need makes other routes visible — which is the only way a disagreement about a single thing can end with both people getting something. ${c.tempt}`,
    }
  },
)

// --- the question that surfaces an interest, asked openly -----------------

const INT_QUESTION: Choice[] = [
  {
    scene: 'Your brother insists the group project has to be a slideshow, and will not budge.',
    correct: 'What would a slideshow do here that another format would not do as well?',
    wrong: [
      'Why are you being so difficult about this when nobody else minds?',
      'You do not really want a slideshow though, do you, if you think about it?',
      'Would you agree that a video would honestly be better for this topic?',
    ],
    tempt: 'The last one tempts because it is polite and it is a question. It is your position wearing a question mark, and the only answers available are yes and an argument.',
  },
  {
    scene: 'A friend keeps insisting you both walk the long way home every day.',
    correct: 'What is it about the long way round that makes it worth the extra time?',
    wrong: [
      'Why do we have to do it your way every single day of the week?',
      'You do not actually mind the short way, do you, when it is raining?',
      'Would it not make far more sense to go the quick way and save time?',
    ],
    tempt: 'The rain version tempts because it feels like finding common ground. It hands them your preferred answer and asks them to sign it, so a real reason never gets said out loud.',
  },
  {
    scene: 'A teammate insists on keeping the same starting line-up every week.',
    correct: 'What are you worried would happen to you if we changed it now?',
    wrong: [
      'Why are you so against giving anybody else a chance to start a game?',
      'You do not seriously think this line-up is our strongest one, surely?',
      'Would you not agree that rotating players is what every good team does?',
    ],
    tempt: 'Asking what they are worried about is the move here, and the "surely" version tempts because it sounds like a challenge to their reasoning. Challenging a position hardens it; asking about the worry underneath does not.',
  },
  {
    scene: 'Your friend insists the group must not invite one particular person to the trip.',
    correct: 'What happened, from your side, that makes this one matter so much?',
    wrong: [
      'Why should everyone else miss out because of a problem you have got?',
      'You cannot seriously expect us to leave somebody out over nothing?',
      'Would you be fine with it if they promised to keep out of your way?',
    ],
    tempt: 'The promise version tempts because it offers a solution. Offering a solution before you know the need means guessing, and a guessed solution that misses turns into evidence that you were not listening.',
  },
  {
    scene: 'A club member insists the meeting must start at exactly four every week.',
    correct: 'What does starting at four actually make possible for you afterwards?',
    wrong: [
      'Why is four the only time in the entire week that works for you?',
      'You could manage half past four if you really had to, could you not?',
      'Would you accept four fifteen as a compromise between the two times?',
    ],
    tempt: 'Jumping to four fifteen tempts because it moves things along. Splitting the difference before anyone knows what four is FOR is how you get a time that fails both people.',
  },
  {
    scene: 'A parent insists you are home by nine on the night of the concert.',
    correct: 'What is the part of a later finish that actually worries you most?',
    wrong: [
      'Why is it nine when literally everybody else is allowed to stay out?',
      'You would let me stay later if it were a school thing though, right?',
      'Would ten be all right if I promised to text you when I set off?',
    ],
    tempt: 'The ten-plus-text version tempts because it is reasonable and specific. It is still a counter-position, and if the worry was about the walk home rather than the hour, it answers nothing.',
  },
  {
    scene: 'A group partner insists on doing the presentation last.',
    correct: 'What is better about going last, from where you are sitting right now?',
    wrong: [
      'Why does it always have to be you who decides the order we go in?',
      'You are not actually bothered about the order, are you, honestly?',
      'Would you go third instead, since somebody has to fill that slot?',
    ],
    tempt: '"You are not actually bothered" tempts because it sounds like giving them an easy way out. It tells them what they feel, and the polite answer to being told what you feel is to agree and resent it.',
  },
  {
    scene: 'A neighbour insists the shared bins stay on their side of the path.',
    correct: 'What makes that side of the path the one that actually works for you?',
    wrong: [
      'Why do you get to decide where the shared bins live, exactly?',
      'You would not really mind them being moved a few feet, would you?',
      'Would you consider moving them if we took them out on your day?',
    ],
    tempt: 'Offering to take the bins out is a genuine concession and tempts for that reason. It is a trade offered before anyone knows what the other side needs, which is how people end up paying for the wrong thing.',
  },
  {
    scene: 'A friend insists the study session has to be at her house every time.',
    correct: 'What is it that works better about your house, from your side of it?',
    wrong: [
      'Why is it never anyone else\'s turn to host the study session?',
      'You would come to mine if I asked you properly, though, would you not?',
      'Would you be all right with alternating houses week by week instead?',
    ],
    tempt: 'Alternating sounds obviously fair, which is exactly why it gets proposed before the reason is known. If she is the one at home with a younger sibling, the fair rota is the thing that cannot work.',
  },
  {
    scene: 'A classmate insists on being the one to email the teacher for the group.',
    correct: 'What is the part of it you would rather not hand over to someone else?',
    wrong: [
      'Why do you not trust any of us to send a single simple email?',
      'You do not have to do everything yourself, you know that, right?',
      'Would you let someone else write it if you got to read it first?',
    ],
    tempt: 'The read-it-first offer is close to a good move and tempts hard. It is still your guess at their need — and if the need is being the one who is answerable, a proofreading right does not touch it.',
  },
]

const intQuestion = tpl(
  {
    id: 'h-int-question',
    name: 'The question that opens it up',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 2,
    variants: INT_QUESTION.length,
    minutes: 2.5,
  },
  (rng, seed) => {
    const c = cycle(seed, INT_QUESTION)
    return {
      title: 'Ask the useful question',
      prompt: `${c.scene}\n\nYou are going to ask them something, out loud, in front of them. Which question is most likely to bring the actual need into the open?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Read each question and ask what answers it allows. Some of these allow only yes, no, and an argument.',
        'A question that already contains your preferred answer collects agreement, not information.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. It asks about their reason rather than their conclusion, so the answer can be something you had not thought of. ${c.tempt} One boundary that matters: this is a question asked openly, in a conversation they know they are in, and if they would rather not say, that is the end of it. Nothing in this lab is a technique for getting information out of someone who does not want to give it.`,
    }
  },
)

// --- the option that meets both needs and neither demand ------------------

const INT_BOTH: Choice[] = [
  {
    scene: 'Two clubs both demand the hall on Friday. Drama needs a floor big enough for a full run-through; the band needs the sound system.',
    correct: 'Drama runs in the gym while the speakers go through to the music room',
    wrong: [
      'Drama takes the hall this Friday and the band takes it the Friday after that',
      'Both use the hall, with the drama half first and the band half after the break',
      'Whichever of the two booked the hall earliest should get to keep it this term',
    ],
    tempt: 'Alternating Fridays tempts because it is the fairest-looking answer on the page. It gives each club what it asked for half as often, when neither of them actually needed the hall — one needed floor, one needed speakers.',
  },
  {
    scene: 'Two acts both demand the last slot on the programme. One has to leave early; the other wants the fullest room.',
    correct: 'The one who leaves early opens up, and the other takes the middle slot',
    wrong: [
      'They share the last slot, taking half the running time each on the night',
      'The one who asked for the slot first should be given it, and the other goes earlier',
      'Draw lots for the last slot, since both of them have an equally good claim to it',
    ],
    tempt: 'Drawing lots tempts because neither side can call it unfair. It also guarantees that one of two solvable problems stays unsolved, when the room is fullest in the middle and the early leaver never wanted late at all.',
  },
  {
    scene: 'Two societies both demand the corridor noticeboard. One is recruiting newcomers; the other is reminding its own members.',
    correct: 'The entrance stand takes recruiting, the club chat takes reminders',
    wrong: [
      'Split the noticeboard down the middle, with one society on each half of it',
      'Give the board to whichever society has the larger membership right now',
      'Rotate the board fortnightly so that each society gets it half of the term',
    ],
    tempt: 'Splitting the board looks like the obvious settlement. Half a board reaches half as many strangers and reminds existing members no better than a message they already read.',
  },
  {
    scene: 'Two housemates both demand the middle fridge shelf. One needs to see her lunches so she remembers them; the other needs height for a tall bottle.',
    correct: 'The bottle goes in the door and the lunches into a box on the top shelf',
    wrong: [
      'Split the middle shelf down the middle, with one of them on each side of it',
      'Alternate weeks, so each of them gets the middle shelf every other week',
      'Whoever moved in first should keep the shelf they have always used',
    ],
    tempt: 'Alternating tempts because it sounds even-handed over time. A fortnight of forgotten lunches and a fortnight of a bottle lying down is two problems taking turns, not a solution.',
  },
  {
    scene: 'Two students both demand the desk by the window. One is drawing and needs daylight; the other needs the wall sockets for a monitor.',
    correct: 'The monitor moves to the socket bench, the drawer takes the window',
    wrong: [
      'They share the window desk, with one taking mornings and one taking afternoons',
      'The desk goes to whoever is in the room more hours in an average week',
      'Move the window desk into the middle so that neither of them has to lose out',
    ],
    tempt: 'Moving the desk to the middle sounds creative and even-handed. It removes the daylight from the person who needed daylight and does not bring a socket any closer, which is the giveaway that neither need was consulted.',
  },
  {
    scene: 'Two siblings both demand the car on Saturday. One has to be at a nine o\'clock shift; the other has a wardrobe to move.',
    correct: 'The early bus covers the shift, a borrowed van takes the wardrobe',
    wrong: [
      'One takes the car in the morning and the other takes it in the afternoon',
      'The one who needs it for work should get it, since work has to come first',
      'They toss for the car, because both of their reasons are perfectly good ones',
    ],
    tempt: 'Splitting the day is genuinely the best of the wrong answers, and in a different case it would work. Here a wardrobe does not go in the car at any hour, so half the argument was never about the car at all.',
  },
  {
    scene: 'Two friends both demand a different weekend for the group trip. One has family that weekend; the other has a deadline right after the other one.',
    correct: 'Friday evening through to Saturday lunchtime clears both of them at once',
    wrong: [
      'They vote on it, and whichever weekend gets more votes is the one they book',
      'Take the weekend that suits the person who suggested the trip in the first place',
      'Cancel the trip this term and try to arrange it again at some point next term',
    ],
    tempt: 'Voting tempts because a group decision feels legitimate. A vote between two options nobody checked settles which person loses, and both of the stated obstacles were about parts of a weekend rather than whole ones.',
  },
  {
    scene: 'Two players demand different kit colours. One wants to be visible in poor light; the other wants a colour that hides grass stains.',
    correct: 'A dark shirt with a high-visibility band running across the shoulders',
    wrong: [
      'Buy both colours and let each player wear whichever one they prefer that week',
      'Take the colour preferred by more of the squad once everybody has voted on it',
      'Pick a mid-grey, which sits between the two colours that were being argued about',
    ],
    tempt: 'Mid-grey is the classic false settlement: it is between the two colours and satisfies neither requirement, being neither visible in poor light nor good at hiding stains.',
  },
  {
    scene: 'Two founders demand different names for the new club. One wants people to know what it does; the other wants beginners to feel welcome.',
    correct: 'A plain description on the poster with a friendly line beneath',
    wrong: [
      'Join the two names together with a hyphen so that both of them are in there',
      'Use one name this year and then change to the other name the year after',
      'Let the committee vote on the two names and use whichever one wins the vote',
    ],
    tempt: 'Hyphenating both names is the purest false compromise there is — everyone can see their word in it, and the result communicates neither clearly nor warmly.',
  },
  {
    scene: 'Two passengers demand the same coach seat. One gets travel sick and needs the front; the other has a long leg and needs the aisle.',
    correct: 'The front window seat for one of them, the second-row aisle for the other',
    wrong: [
      'They swap halfway through the journey so that each of them gets half of it',
      'The seat goes to whoever gets on the coach first on the morning of the trip',
      'Ask a third person to give up their seat so that neither has to be moved',
    ],
    tempt: 'Swapping halfway sounds like sharing. Half a journey of travel sickness is not half a problem, and it is the kind of deal people accept out loud and resent quietly.',
  },
]

const intBoth = tpl(
  {
    id: 'h-int-both',
    name: 'Both needs, neither demand',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 3,
    variants: INT_BOTH.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, INT_BOTH)
    return {
      title: 'Find the deal that works',
      prompt: `${c.scene}\n\nWhich option meets what both sides actually need?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Write the two needs down as a sentence each, without using the thing they are arguing over.',
        'Then look for an option where both sentences come out true. The contested thing often turns out not to appear in either of them.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. Neither side gets the thing they demanded, and both get the thing they needed — which is possible here only because the two needs were different, and invisible while both sides were arguing about one object. ${c.tempt}`,
    }
  },
)

// --- the settlement that satisfies neither --------------------------------

const INT_FAKE: Choice[] = [
  {
    scene: 'Two clubs want the hall on Friday: one needs a two-hour run-through, the other needs a two-hour rehearsal.',
    correct: 'Forty-five minutes each, with a swap halfway through the session',
    wrong: [
      'One club takes this Friday and the other takes next Friday, alternating from there',
      'The club with the performance closest in the calendar gets it for the next month',
      'One club moves to the gym for the term and gets first refusal on the hall next term',
    ],
    tempt: 'Splitting the two hours in half is the settlement everyone reaches for, because it is visibly equal. Neither club can run a two-hour rehearsal in forty-five minutes, so the equal split buys two useless sessions instead of one useful one.',
  },
  {
    scene: 'Two siblings argue over the console: one wants an hour of a story game, the other wants an hour online with friends who log off at eight.',
    correct: 'Thirty minutes each of them, starting at half past seven in the evening',
    wrong: [
      'The one whose friends are online goes first, then the other has it for the rest of the night',
      'They alternate evenings, so each of them gets a full uninterrupted hour every other day',
      'The story game runs in the afternoon and the online session takes the whole evening slot',
    ],
    tempt: 'Half an hour each looks like the fairest possible answer and produces a rushed thirty minutes for one and a half-finished session for the other. Time is only divisible when both people need the same kind of time.',
  },
  {
    scene: 'A parent wants the phone downstairs all night; you want it for the alarm and for a group message at seven.',
    correct: 'The phone comes upstairs at midnight and goes back down again at six',
    wrong: [
      'The phone stays downstairs and a cheap alarm clock gets bought for the bedroom',
      'The phone stays upstairs but hands over its charger, so it runs out by about ten',
      'The phone goes downstairs and the group agrees to move its messages to the morning',
    ],
    tempt: 'The midnight-to-six version sounds like a negotiated middle, and it is a middle of the clock rather than of the needs — it hands the phone over during the hours nobody was arguing about and takes it away during the hours both of them were.',
  },
  {
    scene: 'Two people want the last two tickets: one wants to go with a friend, the other wants to see a particular band that plays first.',
    correct: 'Each of them takes one ticket, and they go to the thing separately',
    wrong: [
      'The one who wanted company takes both tickets and invites the other one along',
      'The band fan takes a ticket and the pair go together to the following month\'s show',
      'Both tickets go to the pair, and the band fan is given first claim on the next release',
    ],
    tempt: 'One ticket each is exactly equal and exactly useless: the person who wanted company goes alone, and going alone was the whole thing they were trying to avoid.',
  },
  {
    scene: 'Two students want the study room: one needs total silence to record, the other needs the piano that is in there.',
    correct: 'Both of them use the room together, quietly, at the same time',
    wrong: [
      'The recording moves to the empty library room and the piano stays free at four',
      'They book alternate days, so each gets three uninterrupted sessions a fortnight',
      'The recording happens first for twenty minutes and the piano gets the rest of it',
    ],
    tempt: 'Sharing the room feels generous and cooperative, which is why it gets suggested. A quiet piano is still audible on a recording, so the deal only works if one of them silently gives up the thing they came for.',
  },
  {
    scene: 'Two friends disagree about the group trip: one cannot afford the expensive option, the other wants the trip to feel special.',
    correct: 'Everyone pays the middle amount and takes the middle option',
    wrong: [
      'The cheaper trip goes ahead, with one evening planned to be something out of the ordinary',
      'The expensive trip goes ahead and those who want to can join for the second day only',
      'The trip is postponed to a term when more people have had a chance to save up for it',
    ],
    tempt: 'The middle price is the false compromise in its purest form: it is still more than one of them has, and it is no longer special. Splitting a price does not split the two different things the price was buying.',
  },
  {
    scene: 'Two teammates want different warm-ups: one needs to raise a heart rate, the other needs to loosen a stiff back.',
    correct: 'Half the running and half the stretching, with both of them cut short',
    wrong: [
      'Five minutes of running for everyone, then stretching for whoever wants it',
      'The full warm-up runs and the stretching happens separately before the session',
      'Warm-ups are done individually, with each player doing what they need to do',
    ],
    tempt: 'Halving both is the reflex answer and the one that fails both requirements at once — too little running to raise anything, too little stretching to loosen anything.',
  },
  {
    scene: 'Two housemates argue about the heating: one is cold in the evening, the other cannot sleep in a warm room.',
    correct: 'The heating stays set at a temperature somewhere between the two',
    wrong: [
      'The heating runs warm until ten and then drops for the rest of the night',
      'The heating stays low and an extra blanket is bought for the cold one',
      'The heating stays low and the cold one gets the room over the boiler',
    ],
    tempt: 'A single in-between temperature is the classic split, and it produces a room that is cold in the evening and warm at night — the two complaints, both preserved. Their needs were separated by TIME, and a thermostat setting cannot see time.',
  },
  {
    scene: 'Two group members disagree on the report: one wants depth on one case, the other wants three cases covered.',
    correct: 'Three of the cases, each covered at roughly a third of the depth',
    wrong: [
      'One case in depth as the main body, with the other two summarised in a closing page',
      'Three cases at the required depth, with the group splitting the extra writing between them',
      'One case in depth this time and a second report covering the other two cases later on',
    ],
    tempt: 'Three shallow cases is the arithmetic middle: it satisfies the count one person wanted and the depth neither of them wanted. It is also the version that reads as though nobody had time.',
  },
  {
    scene: 'Two stallholders want the same hour: one needs the busiest hour to sell, the other has to leave by two.',
    correct: 'They split the busy hour down the middle, half of it each',
    wrong: [
      'The early leaver takes the opening hour and the other takes the busiest one',
      'The early leaver takes the busiest hour and leaves the stall to the other after it',
      'They run the stall together for the busy hour and split the takings evenly at the end',
    ],
    tempt: 'Splitting the busy hour tempts because it divides the valuable thing equally. Thirty minutes of the busy hour is not what either of them needed, and one of them did not need the busy hour at all — only an hour that ended before two.',
  },
]

const intFake = tpl(
  {
    id: 'h-int-fake',
    name: 'The compromise that helps nobody',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 3,
    variants: INT_FAKE.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, INT_FAKE)
    return {
      title: 'Spot the false compromise',
      prompt: `${c.scene}\n\nOne of these settles the argument while meeting neither need. Which one?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Take each option and check it against both needs written out in full. A settlement can be perfectly equal and still fail both.',
        'Splitting works when both sides want the same thing and more of it is better. It fails when each side needs a whole something.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}** is the false compromise: it looks fair because it is equal, and it leaves both people without the thing they came for. ${c.tempt} Splitting is not always wrong — when two people want the same divisible thing, half each is exactly right. It goes wrong when the two sides needed different things, because then the split is measured against the argument rather than against either need.`,
    }
  },
)

// --- two cases, one structure (comparison; shape borrowed from caseComparison)

interface IntCaseSet {
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

const INT_SETS: IntCaseSet[] = [
  {
    principle: 'The demand is one route to a need, and it is rarely the only one',
    a: {
      title: 'The bedroom light',
      text: 'Two brothers share a room. The younger one demands the light off at nine; the older one demands it stays on until eleven. They have argued about the switch every night for a fortnight. Nobody has said out loud that the younger one swims at six in the morning, or that the older one has a reading list he is behind on.',
    },
    b: {
      title: 'The practice slot',
      text: 'A band cannot agree on Saturday. The drummer demands the morning; the singer demands the afternoon and will not move. Neither has mentioned that the drummer\'s neighbours have complained about any noise after midday, or that the singer works a shift that ends at twelve.',
    },
    criteria: [
      'Say what each side ASKED for, and what each side would still need if the answer were no',
      'Point out that the thing being argued over is not what either of them needs',
      'Describe a settlement that gives neither side the thing they demanded',
    ],
    model:
      'In both cases the two sides are arguing over a single object — a light switch, a slot in a day — and each has picked one setting of that object as their demand. Underneath, they need different things: sleep and reading light; a quiet hour and an hour after a shift ends. Because the needs are different rather than opposed, there are settings of the world that satisfy both, and none of them is a point on the line the two sides were arguing along. A clip-on book light meets both brothers; Sunday morning, or a different room, meets both musicians. The move is to stop bargaining over the object and ask what each side would still need if they lost.',
    key: 'Each side named one route to its need, and the routes collided while the needs did not',
    decoys: [
      'One side in each case is being unreasonable, and the fair answer is for that side to give way',
      'Both sides want the same thing, so the only workable settlement is to divide it evenly between them',
      'The disagreements are about who has authority, so somebody senior should decide and end the argument',
      'Neither side has enough information about the other, so more discussion would eventually settle it fairly',
    ],
    transfer: {
      text: 'A club treasurer demands the whole budget goes on new equipment. The captain demands it all goes on travel to away fixtures. Underneath: the treasurer is tired of the team borrowing broken gear on match days, and the captain needs the team to reach the regional round, which is three away trips.',
      key: 'Ask what each of them actually needs, then check whether a cheaper route covers one of them',
      decoys: [
        'Split the budget in half, since both of them have made an equally reasonable case for it',
        'Give it to the captain, because reaching the regional round matters more than the equipment does',
        'Put the decision to a vote of the whole club and spend the money on whichever side wins it',
        'Delay the decision until next term, when there will be more money in the account to divide up',
      ],
    },
    why: 'The trap is treating the object as the thing in dispute. Once the needs are written down separately, the object usually turns out to be one of several ways to meet them, and often the worst one.',
  },
  {
    principle: 'The demand is one route to a need, and it is rarely the only one',
    a: {
      title: 'The dinner phone',
      text: 'A parent demands the phone is off at the table. A teenager demands to keep it and the argument repeats nightly. What has not been said: the parent has had about four minutes of conversation with them all week, and the teenager is coordinating a group deadline where three people are waiting on one answer.',
    },
    b: {
      title: 'The extension',
      text: 'A student demands an extension on an essay; the teacher refuses flatly. Unsaid on both sides: the student lost a week of the topic to flu and does not want a mark that records the flu, and the teacher has promised the whole class marked work back on Friday and cannot hold the set open.',
    },
    criteria: [
      'Name the stated demand and the underlying need on each side, in both cases',
      'Say why the argument as posed has no answer that works for both',
      'Give a settlement in which neither stated demand is granted',
    ],
    model:
      'Both arguments have been framed as a single yes-or-no about one thing: the phone at the table, the deadline on the essay. Framed that way there is no shared answer, because a yes for one is a no for the other. The needs underneath are not opposed at all — attention at dinner and three people unblocked; a mark that is not distorted by a lost week and a class that gets its work back on Friday. Each of those can be met without granting either demand: a reply sent before the meal and the phone face-down after it; the essay submitted on time for feedback with the mark taken from a later piece. The general move is to stop answering the question as asked and ask what each side loses if they lose.',
    key: 'A yes-or-no question about one object hides two separate needs that were never really in conflict',
    decoys: [
      'One side has more authority in each case, so their preference should decide how it is settled',
      'Both sides want the same thing here, so the fair settlement is to split the difference between them',
      'Each argument is really about respect rather than the object, and should be discussed in those terms',
      'The two sides simply want incompatible things, and somebody has to lose for the matter to be settled',
    ],
    transfer: {
      text: 'A shop owner demands a delivery driver stops parking on the forecourt. The driver demands the forecourt because it is the only place within reach of the door. Underneath: the owner is losing the two customer spaces at the busiest hour, and the driver cannot carry crates any further than about ten metres.',
      key: 'Look for a spot within ten metres of the door that is not one of the two customer spaces',
      decoys: [
        'Let the driver use the forecourt but only outside the busiest hour of the whole trading day',
        'The shop owner should give way, since deliveries are what keeps the shop stocked in the first place',
        'Split the forecourt so that the driver has one space and the customers keep the other one',
        'Agree that whoever arrives at the forecourt first in the morning has the use of it for that day',
      ],
    },
    why: 'When a dispute is posed as a yes-or-no, the framing itself is doing the damage: it guarantees a loser before anyone has checked whether the two needs actually collide.',
  },
  {
    principle: 'The demand is one route to a need, and it is rarely the only one',
    a: {
      title: 'The slides',
      text: 'Two members of a project group both demand to make the slides, and it has stalled the whole thing for four days. Neither has said why: one has been told by a tutor that her work is never visible in group marks, and the other has watched two projects lose marks for slides thrown together the night before.',
    },
    b: {
      title: 'The window desk',
      text: 'Two sixth-formers both demand the desk by the window in the shared study room, and now neither uses it. One of them draws and cannot work under the strip light; the other has a monitor and needs the wall sockets, which happen to be beside that desk.',
    },
    criteria: [
      'For each case, separate what was demanded from what the person is actually protecting',
      'Explain why both people can be satisfied without either of them getting the demand',
      'Say what question would have surfaced this in the first five minutes',
    ],
    model:
      'In both cases two people demand the same single thing, and the reasons they want it have almost nothing in common. One wants visible credit; the other wants the work to be good. One wants daylight; the other wants power. Because the reasons differ, the object can be unbundled: one person owns the design and the other presents, so both the visibility and the quality are covered; the monitor moves to a bench with sockets and the drawer keeps the window. Neither case needed a fairer way to divide the object — it needed somebody to ask what the object was FOR.',
    key: 'Two people wanted one object for unrelated reasons, so the object could be unbundled',
    decoys: [
      'The person who asked first has the stronger claim, and settling it that way avoids further argument',
      'Both people want the same thing, so the sensible answer is to take turns with it week by week',
      'The disagreement is really about status in the group, and the object itself is beside the point',
      'A neutral third person should decide, because neither of the two can judge the situation fairly',
    ],
    transfer: {
      text: 'Two volunteers both demand the front table at the fair, and the argument has run all week. One is collecting sign-ups and needs to catch people as they come in. The other is selling cakes and needs somewhere with a power socket for the urn.',
      key: 'Check whether the two stated requirements are even about the same place to begin with',
      decoys: [
        'Split the front table down the middle so that both of them have half of it to work from',
        'Give the front table to sign-ups, since sign-ups matter more to the club than the cake stall does',
        'Alternate the front table by the hour, so that each of them gets a fair share of the busy period',
        'Ask the organiser to decide between them, since a neutral person will settle it more fairly',
      ],
    },
    why: 'When two people want one thing for different reasons, the thing can usually be taken apart. The fight lasts as long as nobody asks what each of them is really protecting.',
  },
]

function comparisonParts(rng: Rng, set: IntCaseSet): ItemPart[] {
  return [
    {
      stage: 'Compare',
      study: `CASE 1 — ${set.a.title}\n\n${set.a.text}\n\n---\n\nCASE 2 — ${set.b.title}\n\n${set.b.text}`,
      studySeconds: 90,
      prompt:
        'In your own words: what is the same about how these two arguments WORK? Ignore the people and the setting. Describe the shared structure, and what it means for what should be done.',
      answer: draft({
        criteria: set.criteria,
        model: set.model,
        minWords: 25,
        placeholder: 'What both arguments have in common is…',
      }),
      explanation:
        'This part is never scored — the app cannot read writing, and marking it would be pretending. Writing the comparison is what does the work: in the study this method comes from, learners who wrote out the shared structure applied it to a new case two to three times as often as learners who read the same two cases separately.',
      hints: [
        'Cross out the names and the setting. What is left?',
        'Write down what each side ASKED for, then what each side would still need if the answer were no.',
        'Ask what made a settlement possible in BOTH cases rather than in one of them.',
      ],
    },
    {
      stage: 'Principle',
      prompt: 'Which statement names the structure that both cases share?',
      answer: mcq(rng, set.key, set.decoys),
      explanation: `${set.principle}. ${set.why}`,
    },
    {
      stage: 'New case',
      prompt: `A third situation, unrelated to either of the first two:\n\n${set.transfer.text}\n\nWhat does the shared structure say to do here?`,
      answer: mcq(rng, set.transfer.key, set.transfer.decoys),
      explanation:
        'This is the point of the exercise. Recognising the structure in a case that shares none of the surface details is what was actually learned; getting the first two right only shows they were read.',
    },
  ]
}

const intCases = tpl(
  {
    id: 'h-int-cases',
    name: 'Two cases: what the demand was for',
    skillIds: ['h-interests'],
    bucket: 'insight',
    difficulty: 3,
    variants: INT_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => {
    const set = cycle(seed, INT_SETS)
    return {
      title: 'Two cases',
      prompt: 'Two arguments that look nothing alike. Read both, then find what they have in common.',
      parts: comparisonParts(rng, set),
      hints: [
        'Cross out every name, place and subject. Describe what is left.',
        'Ask what each side would still need if they simply lost the argument.',
        'The structure is whatever makes the same move work in BOTH cases.',
      ],
      explanation: `${set.principle}. ${set.why}`,
    }
  },
)

// ===========================================================================
// h-repair — repair after it goes wrong
// ===========================================================================

const REP_ENTRY: Choice[] = [
  {
    scene: 'You repeated something Ama had told you in confidence, and it got back to her.',
    correct: '"I repeated what you told me in confidence, and I can see that makes me harder to trust. I won\'t do it again."',
    wrong: [
      '"I feel completely awful about this, I have honestly not slept since it happened and I keep going over it in my head."',
      '"I\'m sorry if it upset you — I genuinely did not think it was meant to be a secret, or I would never have said anything at all."',
      '"I\'ve said sorry about it twice now, so can we drop it and get back to normal, because this is getting a bit much."',
    ],
    tempt: 'The first wrong one is the hardest to spot, because everything in it is true and it sounds like remorse. It puts her in the position of comforting you about the thing you did to her, which is more work than she had before you apologised.',
  },
  {
    scene: 'You forgot to pass on a message and Ben missed a deadline because of it.',
    correct: '"I forgot to pass the message on and you missed it because of me. I\'ll write things down from now on."',
    wrong: [
      '"I really am gutted about this, I have been beating myself up over it all weekend and I still cannot believe I did it."',
      '"I\'m sorry if it caused you a problem — although in fairness the message did come in very late and there was a lot going on."',
      '"I\'ve apologised, so can we please move on from it now, because I do not know what else you want me to say."',
    ],
    tempt: 'The "in fairness" version is tempting because the extra context is genuinely true. An explanation offered in the same breath as an apology reads as a defence, and the listener has to decide which half you meant.',
  },
  {
    scene: 'You broke something you had borrowed from Jae and said nothing for a week.',
    correct: '"I broke it and then hid it for a week, which was worse than breaking it. I\'ll replace it and I won\'t hide things."',
    wrong: [
      '"I have felt sick about this every single day, honestly, and I nearly told you about six separate times and could not do it."',
      '"I\'m sorry if you\'re annoyed — it was already a bit loose when you gave it to me, so it was probably going to go at some point."',
      '"Look, I\'ve told you now and I\'ve said sorry, so can we be normal again, because it is only a thing at the end of the day."',
    ],
    tempt: 'The "already a bit loose" line is the classic explain-as-excuse: it is offered as information and lands as a claim that it was not really your fault, which takes the apology back while it is still in the air.',
  },
  {
    scene: 'You snapped at your sister during a bad week and she has been avoiding you since.',
    correct: '"I snapped at you and you had done nothing to deserve it. I\'ll say when I am at my limit instead of taking it out on you."',
    wrong: [
      '"I have had the worst week of the whole term, honestly, and everything has been piling up and I just could not take any more of it."',
      '"I\'m sorry if I came across badly — you did keep going on at me when I had already asked you three separate times to stop."',
      '"I\'ve said sorry now so can you stop being weird with me, because it was days ago and I would rather just forget about it."',
    ],
    tempt: 'The bad-week version tempts because a bad week is a real cause and often the true one. Causes explain; they do not repair. Said instead of an apology, an explanation asks the other person to excuse you before you have owned anything.',
  },
  {
    scene: 'You took credit for a group idea in front of the class, and Maya was sitting right there.',
    correct: '"That was your idea and I let the credit come to me instead of you. I\'ll correct it in front of the same people on Monday."',
    wrong: [
      '"I honestly did not even realise I was doing it until afterwards, and then I felt terrible about it for the entire rest of the day."',
      '"I\'m sorry if it looked bad — I was put on the spot and it just came out, and everyone knows we work on that stuff together anyway."',
      '"I\'ve said I\'m sorry, so are we good now, because I do not want this hanging over the group for the rest of the project."',
    ],
    tempt: '"Everyone knows we work together anyway" is the strongest wrong option, because it might even be true. It argues that the harm did not really happen, which is a disagreement dressed as an apology.',
  },
  {
    scene: 'You left Iris out of the plans in the group chat and she found out afterwards.',
    correct: '"We planned the whole thing without you, and I know how that must have looked from outside. I\'ll ask you first next time."',
    wrong: [
      '"I have felt guilty about it ever since it happened, honestly, and I nearly messaged you about four times to explain the whole thing."',
      '"I\'m sorry if you felt left out — it was a really last-minute thing and nobody was deliberately trying to exclude anybody at all."',
      '"I\'ve apologised for it now, so can we let it go, because dragging it out is making it into a much bigger thing than it was."',
    ],
    tempt: '"I\'m sorry if you felt left out" is the conditional apology, and it is the most common one there is: it apologises for her reaction rather than for the thing, which quietly puts the problem in her.',
  },
  {
    scene: 'You have been late three times in a row to meet Theo, without warning him.',
    correct: '"I have been late three times now and left you standing there each time. I\'ll leave earlier rather than promise again."',
    wrong: [
      '"I am genuinely the worst at this, I know, I have always been terrible with time and it drives absolutely everybody around me mad."',
      '"I\'m sorry if it annoyed you — although the bus has been a nightmare all month and the timetable changed without any warning."',
      '"I\'ve said sorry each time, so can we not do this again, because I really am trying and it feels like nothing is ever enough."',
    ],
    tempt: 'Calling yourself the worst tempts because it sounds like taking responsibility. It converts a fixable behaviour into a permanent trait, which quietly says this will keep happening — and invites the other person to reassure you.',
  },
  {
    scene: 'You made a joke about the way Sami reads aloud and the class laughed.',
    correct: '"I made a joke at your expense in front of everyone, and it landed on you rather than on nobody. I won\'t do that again."',
    wrong: [
      '"I did not mean anything by it at all, I promise, I make jokes about absolutely everyone and it is honestly just how I talk to people."',
      '"I\'m sorry if it landed badly — it was obviously a joke, and I think a couple of other people took it the wrong way as well."',
      '"I\'ve said sorry, so can we be fine now, because I do not want you thinking I am the sort of person who does things like that."',
    ],
    tempt: '"It was obviously a joke" is the version that does the most damage: it tells the person their reaction was a misreading, so the apology and the second injury arrive in the same sentence.',
  },
  {
    scene: 'You read a message over Kit\'s shoulder and then mentioned it later.',
    correct: '"I read your screen over your shoulder and then brought it up, which was twice over the line. I won\'t look at your phone."',
    wrong: [
      '"I feel really weird about this now, honestly, and I have been trying to work out how to bring it up with you for about three days."',
      '"I\'m sorry if that felt intrusive — it was right there in front of me, and I did not exactly go looking for it or anything like that."',
      '"I\'ve told you and said sorry, so can we drop it now, because it is not like I did anything with what I saw afterwards."',
    ],
    tempt: '"It was right there in front of me" is a true and irrelevant fact, and that combination is what makes an excuse persuasive to the person giving it and infuriating to the person receiving it.',
  },
  {
    scene: 'You said you would help move the stall and then did not turn up.',
    correct: '"I said I would be there and then I was not, and you had to cover it alone. I\'ll turn up on Saturday and actually do it."',
    wrong: [
      '"I have honestly felt bad about this all week, and I kept meaning to message you and then the day just completely got away from me."',
      '"I\'m sorry if you were short-handed — there were four other people down for it, so I assumed it would be covered without me."',
      '"I\'ve said sorry about it already, so can we leave it there, because I really do not need this on top of everything else."',
    ],
    tempt: '"There were four other people down for it" tempts because it sounds like a fair point about the impact. Whether the harm was small is not the apologiser\'s call to make in the apology.',
  },
  {
    scene: 'You changed the group\'s plan without telling Noor, who had booked the room.',
    correct: '"I changed the date without telling you after you had already booked around it. I\'ll check with you before moving anything."',
    wrong: [
      '"I did not think it would matter that much, honestly, and then when I realised it did I was too embarrassed to say anything about it."',
      '"I\'m sorry if that messed you around — it was a group decision in the end, and it happened quite fast in the chat that evening."',
      '"I\'ve apologised now, so can we move past it, because everyone else seems perfectly fine about how the whole thing worked out."',
    ],
    tempt: '"It was a group decision" spreads the responsibility across people who are not in the conversation. Shared blame is not the same as no blame, and the person who made the call is still the person apologising.',
  },
  {
    scene: 'You lost a book Cass lent you and only admitted it when she asked.',
    correct: '"I lost your book and then waited for you to ask rather than telling you. I\'ll get you another copy this week."',
    wrong: [
      '"I have been dreading this conversation for about two weeks, honestly, and I kept hoping it would turn up somewhere in the house."',
      '"I\'m sorry if you\'re annoyed about it — you did say there was no rush at all with it, so I did not think it was urgent to mention."',
      '"I\'ve said sorry and I\'ll get you a new one, so can we be done, because it is a book and I would rather not keep going over it."',
    ],
    tempt: 'The last one contains a real offer of repair, which is exactly why it tempts — but it arrives strapped to a deadline for her feelings, and the deadline is the part she will remember.',
  },
]

const repEntry = tpl(
  {
    id: 'h-rep-entry',
    name: 'Which apology does the work?',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 2,
    variants: REP_ENTRY.length,
    minutes: 2,
  },
  (rng, seed) => {
    const c = cycle(seed, REP_ENTRY)
    return {
      title: 'Four attempts',
      prompt: `${c.scene}\n\nFour things you could say. Which one actually repairs anything?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look for two things: the specific thing that was done, named plainly, and what will be different afterwards.',
        'Then check who has been given work to do. If the other person now has to reassure you, argue with you, or decide quickly, the apology handed them a job.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. It names the specific thing and says what changes — the two components rated most important when people judged written apologies in a study of six possible ingredients (Lewicki, Polin & Lount, 2016), where a request for forgiveness came out least important of the six. ${c.tempt} Worth being straight about the evidence: that study measured how apologies were RATED, not whether relationships recovered. The words are not the repair. What changes is the repair, and the sentence is only a promise about it.`,
    }
  },
)

// --- sorting repair from second injury ------------------------------------

const REP_SORT: SortCase[] = [
  {
    scene: 'You were sharp with a friend in front of other people and you want to put it right.',
    statements: [
      { text: '"I was sharp with you in front of everyone and it was unfair."', category: 0 },
      { text: '"I\'m sorry you took it that way — it was not meant like that."', category: 1 },
      { text: '"I\'ll say it to you privately next time, not in a group."', category: 0 },
      { text: '"You have been quite sharp with me before as well, though."', category: 1 },
      { text: '"You do not have to say anything back to me right now."', category: 0 },
      { text: '"Can we be normal again? This is making everything awkward."', category: 1 },
    ],
    note: 'The scoreboard line is the fastest way to turn an apology into a second argument: it invites a comparison of who has been worse, which nobody wins and nobody forgets.',
  },
  {
    scene: 'You forgot something that mattered to someone and they have gone quiet on you.',
    statements: [
      { text: '"I forgot, and it mattered to you, and that is on me."', category: 0 },
      { text: '"I would have remembered if you had reminded me about it."', category: 1 },
      { text: '"I have put it in my calendar so it does not happen again."', category: 0 },
      { text: '"Everyone forgets things — you have forgotten mine before."', category: 1 },
      { text: '"Tell me if there is something that would help right now."', category: 0 },
      { text: '"I have said sorry, so I do not know what else to do here."', category: 1 },
    ],
    note: '"I would have remembered if you had reminded me" is the reversal: it hands the responsibility back across the table in the middle of the sentence where you were taking it.',
  },
  {
    scene: 'You said something that landed much harder than you meant it to.',
    statements: [
      { text: '"What I said was out of order, whatever I meant by it."', category: 0 },
      { text: '"I did not mean it like that, so it should be fine really."', category: 1 },
      { text: '"I will not use that as a joke about you again."', category: 0 },
      { text: '"You are being oversensitive about a throwaway comment."', category: 1 },
      { text: '"I am not asking you to be fine with it straight away."', category: 0 },
      { text: '"I have apologised, so you need to let it go now."', category: 1 },
    ],
    note: 'Intent is genuinely relevant to whether you are a bad person, and completely irrelevant to whether it hurt. Leading with intent asks to be judged on the question you would rather answer.',
  },
  {
    scene: 'You broke a promise about something small and they have mentioned it twice.',
    statements: [
      { text: '"I said I would and then I did not. That is the whole of it."', category: 0 },
      { text: '"It was hardly a big deal in the scheme of things, though."', category: 1 },
      { text: '"Next time I will tell you as soon as I know I cannot."', category: 0 },
      { text: '"You are keeping score of every little thing I do wrong."', category: 1 },
      { text: '"You can bring it up again if it is still bothering you."', category: 0 },
      { text: '"I feel terrible, honestly — please say we are all right."', category: 1 },
    ],
    note: '"Please say we are all right" is the one people are most surprised by, because it sounds warm. It asks the person you hurt to look after your feelings before they have finished having their own.',
  },
  {
    scene: 'You went through someone\'s things without asking and they found out.',
    statements: [
      { text: '"I went through your stuff without asking. That was not okay."', category: 0 },
      { text: '"I was only looking for the charger, so it is not that bad."', category: 1 },
      { text: '"I will ask first, every time, even when you are not in."', category: 0 },
      { text: '"You would have done exactly the same thing in my position."', category: 1 },
      { text: '"I get why you are annoyed and I am not going to argue it."', category: 0 },
      { text: '"You are making this into a much bigger thing than it is."', category: 1 },
    ],
    note: 'Sizing the harm on the other person\'s behalf ("it is not that bad", "a bigger thing than it is") is the most common second injury of all, because the apologiser genuinely believes they are being reasonable.',
  },
  {
    scene: 'You let someone take the blame for something you did and stayed quiet.',
    statements: [
      { text: '"You took the blame for something I did and I said nothing."', category: 0 },
      { text: '"You did not exactly deny it very hard at the time, though."', category: 1 },
      { text: '"I will tell them tomorrow morning that it was me."', category: 0 },
      { text: '"I panicked, so it is not like I did it on purpose to you."', category: 1 },
      { text: '"You do not owe me a reply to this — I just needed to say it."', category: 0 },
      { text: '"Can you not tell anyone I told you? It would look awful."', category: 1 },
    ],
    note: 'The last line turns a repair into a request. An apology that comes with terms attached is asking for something, and asking is not what this moment is for.',
  },
  {
    scene: 'You cancelled on someone at the last minute for the third time.',
    statements: [
      { text: '"Three times now. That is a pattern and it is mine to fix."', category: 0 },
      { text: '"You cancel on people too, so I do not see the problem."', category: 1 },
      { text: '"I am not going to say yes to things I cannot do."', category: 0 },
      { text: '"It is not as if we had actually booked anything for it."', category: 1 },
      { text: '"I would rather hear how annoying that has been than not."', category: 0 },
      { text: '"Do not be like that — I have said I am sorry about it."', category: 1 },
    ],
    note: '"I am not going to say yes to things I cannot do" is the part people leave out. It is the only line in the column that changes what happens next month, which is what makes it repair rather than etiquette.',
  },
  {
    scene: 'You shared a photo of someone that they had asked you not to share.',
    statements: [
      { text: '"You asked me not to share it and I shared it anyway."', category: 0 },
      { text: '"Nobody who saw it even thought anything of it, honestly."', category: 1 },
      { text: '"I have taken it down and I will not repost it anywhere."', category: 0 },
      { text: '"You put it in the chat first, so it was hardly private."', category: 1 },
      { text: '"If there is anything else you want taken down, tell me."', category: 0 },
      { text: '"You have to admit you are being a bit dramatic about it."', category: 1 },
    ],
    note: 'Telling somebody how other people received it answers a question they did not ask. What they asked was that it not be shared, and that part is not in dispute.',
  },
  {
    scene: 'You interrupted and talked over someone through a whole meeting.',
    statements: [
      { text: '"I talked over you for most of that and I noticed too late."', category: 0 },
      { text: '"You could have just said something at the time, though."', category: 1 },
      { text: '"I will leave a gap and check you have finished speaking."', category: 0 },
      { text: '"That is just how I get when I am into something, sorry."', category: 1 },
      { text: '"Say if I do it again — I would rather be told than not."', category: 0 },
      { text: '"I have said sorry twice, so can we stop going over it."', category: 1 },
    ],
    note: '"That is just how I get" is an apology and a warning in one sentence: it says sorry and then says it will happen again, which is why it leaves the other person feeling worse rather than better.',
  },
  {
    scene: 'You told a friend\'s news to somebody before they had the chance to.',
    statements: [
      { text: '"That was yours to tell, and I told it. I am sorry."', category: 0 },
      { text: '"They would have found out by the end of the week anyway."', category: 1 },
      { text: '"I will not pass anything of yours on again, at all."', category: 0 },
      { text: '"You never actually said it was supposed to be a secret."', category: 1 },
      { text: '"Take as long as you want before you talk to me about it."', category: 0 },
      { text: '"Please do not be weird with me over something this small."', category: 1 },
    ],
    note: '"You never said it was a secret" is the technicality defence. It may even be accurate, and being accurate about the rules is a strange thing to do while apologising for breaking one.',
  },
]

const repSort = tpl(
  {
    id: 'h-rep-fail',
    name: 'Repair or second injury?',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 2,
    variants: REP_SORT.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, REP_SORT)
    return {
      title: 'Sort the sentences',
      prompt: `${c.scene}\n\nSort each sentence: does it **repair**, or does it **add a second hit**?`,
      answer: classify(rng, ['Repairs it', 'Adds a second hit'], c.statements),
      hints: [
        'Ask what job the sentence gives the other person. Repair lines give them nothing to do; the others ask them to argue, to reassure, or to hurry up.',
        'Watch for the three reversals: sizing the harm for them, comparing it to something they did, and asking them to say it is fine.',
        'Worked path: the full sorting is in the explanation.',
      ],
      explanation: `${c.statements
        .map((s) => `**${['Repairs', 'Second hit'][s.category]}**: ${s.text}`)
        .join(' ')} ${c.note} None of the second-hit lines are unusual or cruel — they are what people say when they want the discomfort to end, which is exactly why they need naming.`,
    }
  },
)

// --- ranking, with the test stated so the order is derivable --------------

interface Attempt {
  text: string
  /** 1 strongest .. 4 weakest, by the test stated in the prompt. */
  tier: number
}

interface RankCase {
  scene: string
  attempts: [Attempt, Attempt, Attempt, Attempt]
  note: string
}

const REP_RANK: RankCase[] = [
  {
    scene: 'You lost a folder of shared notes two days before a test.',
    attempts: [
      { text: '"I lost the folder. I am rewriting the two topics tonight and sending them by ten."', tier: 1 },
      { text: '"I lost the folder we both worked on and I know what that means two days out."', tier: 2 },
      { text: '"I lost it, but the bag was open because you handed it to me in a rush."', tier: 3 },
      { text: '"I am sorry if this has messed you up. Can we call it even and move on?"', tier: 4 },
    ],
    note: 'The third one is worth pausing on: the fact about the bag might be perfectly true. It is still doing the work of moving the loss onto the other person, in a sentence that opened by taking it.',
  },
  {
    scene: 'You told other people something a friend had told you privately.',
    attempts: [
      { text: '"I repeated what you told me. I will not pass anything of yours on again."', tier: 1 },
      { text: '"I repeated something you told me privately, and that was yours to tell."', tier: 2 },
      { text: '"I only told one person, and honestly it came up because they asked me directly."', tier: 3 },
      { text: '"Sorry if you are upset. Can you please not be weird with me at school tomorrow?"', tier: 4 },
    ],
    note: '"It came up because they asked me" is the most sympathetic excuse in the set, and it still answers a question nobody asked. Nobody was disputing how it came up.',
  },
  {
    scene: 'You missed your slot on the stall rota and left one person alone for two hours.',
    attempts: [
      { text: '"I left you on your own for two hours. I am taking your slot next Saturday."', tier: 1 },
      { text: '"I did not turn up and you covered the whole thing by yourself. That was on me."', tier: 2 },
      { text: '"I forgot, though to be fair the rota went up in the chat while I was away."', tier: 3 },
      { text: '"I am sorry if it was hard. I have apologised now so can we leave it there?"', tier: 4 },
    ],
    note: 'Notice that the strongest one is not the most emotional. It is the one where something in the world changes as a result — an offer of repair, rather than a stronger feeling about the harm.',
  },
  {
    scene: 'You copied a friend\'s answers and they got questioned about it too.',
    attempts: [
      { text: '"I copied and you got pulled in for it. I am telling her it was me tomorrow."', tier: 1 },
      { text: '"You got questioned because of something I did, and that was not fair on you."', tier: 2 },
      { text: '"I copied, but you did leave it open on the desk right next to me."', tier: 3 },
      { text: '"Sorry if that was stressful. Are we fine now? I really do not need this today."', tier: 4 },
    ],
    note: 'The fourth one contains a real apology and then adds a deadline and a complaint. Anything that tells the other person to hurry up belongs at the bottom, however sincerely the first half was meant.',
  },
  {
    scene: 'You made a joke about someone in front of a group and it did not land as a joke.',
    attempts: [
      { text: '"I made you the joke in front of everyone. I am not doing that again."', tier: 1 },
      { text: '"I made a joke at your expense in front of the whole group and it was not okay."', tier: 2 },
      { text: '"It was a joke, but I can see how it might have come out badly in that setting."', tier: 3 },
      { text: '"Sorry if you took it the wrong way. Everyone else thought it was funny, honestly."', tier: 4 },
    ],
    note: 'The last one manages three failures in two lines: conditional on their reaction, blaming their reading, and citing an audience. The audience line is the one people remember for years.',
  },
  {
    scene: 'You went ahead with a plan after someone had said they could not make that day.',
    attempts: [
      { text: '"You told me you could not do Friday and we did it anyway. I will check next time."', tier: 1 },
      { text: '"We went ahead on the day you had already said you could not do. That was rubbish."', tier: 2 },
      { text: '"We did go ahead, though nobody could agree on any other day that worked."', tier: 3 },
      { text: '"Sorry if you felt left out. It was not deliberate so I would rather drop it."', tier: 4 },
    ],
    note: 'The third one is a genuine constraint offered at exactly the wrong moment. Constraints belong in the conversation about what happens next, not in the sentence where you are taking responsibility.',
  },
  {
    scene: 'You read a message on someone\'s phone and then referred to it later.',
    attempts: [
      { text: '"I read your screen and then used it. I am not looking at your phone again."', tier: 1 },
      { text: '"I read something on your phone that was not mine to read, and then I mentioned it."', tier: 2 },
      { text: '"I did read it, but it was open on the table between us for about ten minutes."', tier: 3 },
      { text: '"Sorry if that felt like a big deal. Can we not make it into a whole thing?"', tier: 4 },
    ],
    note: '"Can we not make it into a whole thing" decides the size of the harm on behalf of the person who was harmed. That decision is not the apologiser\'s to make, which is what puts it below even the excuse.',
  },
  {
    scene: 'You said you would help with a move and did not turn up or message.',
    attempts: [
      { text: '"I said I would be there and I went silent. I am free Sunday and I will be there."', tier: 1 },
      { text: '"You were expecting me and I did not turn up or message you all day. That is on me."', tier: 2 },
      { text: '"I did not come, but there were three other people down for it that morning."', tier: 3 },
      { text: '"Sorry if you were short-handed. I have said sorry, so are we all right now?"', tier: 4 },
    ],
    note: 'The gap between the top two is the whole lesson: both name the harm honestly, and only one of them changes anything. An apology with nothing after it is a description.',
  },
  {
    scene: 'You forgot a friend\'s performance after saying you would come.',
    attempts: [
      { text: '"I forgot and you were looking out for me. I am coming to the next one."', tier: 1 },
      { text: '"You were expecting me to be in that audience and I forgot completely."', tier: 2 },
      { text: '"I forgot, though it was on the same night as the thing I had already told you about."', tier: 3 },
      { text: '"Sorry if it hurt. It was one night, so can we please not stretch this out?"', tier: 4 },
    ],
    note: '"It was one night" is a size judgement again, and it is doing exactly what the excuse before it did — only faster, and with a deadline attached.',
  },
  {
    scene: 'You told someone\'s news to a group before they had had the chance to.',
    attempts: [
      { text: '"That was yours to tell and I told it. I will let people know I got ahead of you."', tier: 1 },
      { text: '"I told everyone your news before you had the chance to tell anybody yourself."', tier: 2 },
      { text: '"I did tell them, but you had already put it in the chat with the six of us."', tier: 3 },
      { text: '"Sorry if you wanted to say it yourself. They would have known by Friday anyway."', tier: 4 },
    ],
    note: 'The bottom two both argue that the harm was small — one by pointing at what you already did, one by pointing at what would have happened anyway. Neither is a repair, and both invite a second argument.',
  },
]

const repRank = tpl(
  {
    id: 'h-rep-rank',
    name: 'Rank the repair attempts',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 3,
    variants: REP_RANK.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, REP_RANK)
    const shuffled = shuffle(rng, c.attempts)
    const options = shuffled.map((a) => a.text)
    const correct = shuffled
      .map((a, i) => ({ tier: a.tier, i }))
      .sort((x, y) => x.tier - y.tier)
      .map((o) => o.i)
    const order = shuffled.slice().sort((x, y) => x.tier - y.tier)
    return {
      title: 'Strongest first',
      prompt: `${c.scene}\n\nTap these in order, strongest repair first. The test, in this order:\n\n1. It names the specific thing AND says what will be different.\n2. It names the specific thing, but nothing changes.\n3. It half-owns it and hands you an excuse.\n4. It puts the work back on the person who was hurt — "sorry if", or asking to be forgiven now.`,
      answer: { type: 'order', options, correct },
      hints: [
        'Do the bottom first: find the one that asks the other person to be finished, or apologises for their reaction rather than for the act.',
        'Then separate the top two. Both may name the harm honestly, and only one of them says what changes.',
        `Worked path: **${order.map((a) => a.text.slice(1, 34)).join('** → **')}**.`,
      ],
      explanation: `Strongest first: ${order
        .map((a, i) => `(${i + 1}) ${a.text}`)
        .join(' ')} ${c.note} The order comes from the test in the prompt, not from how sorry each one sounds — tone is the thing that is easiest to produce and tells you least.`,
    }
  },
)

// --- when they are not ready, and repair is not owed on demand ------------

const REP_READY: Choice[] = [
  {
    scene: 'You apologised properly yesterday — named the thing, said what would change. Today your friend is still short with you.',
    correct: 'Nothing more right now, because it was said once and heard once, and repeating it helps you rather than them',
    wrong: [
      'Apologise again, in more detail, so that she can see how much you actually meant it the first time',
      'Ask her to tell you when she has forgiven you, so at least you both know where the two of you stand',
      'Leave it entirely — she has clearly decided not to move on from this, and there is nothing left you can do',
    ],
    tempt: 'Apologising again is the option almost everyone picks, and it is the one that undoes the first apology: a second round asks her to manage your discomfort about the wait, which makes the wait about you.',
  },
  {
    scene: 'Someone apologised to you an hour ago. You accepted it, and now they are asking why you are still being weird.',
    correct: '"I heard you, and I am not pretending otherwise. I need a bit longer before this feels normal again."',
    wrong: [
      'Say that it is completely fine, because they did apologise properly and it is not fair to keep them waiting',
      'Refuse to talk to them at all until they have apologised a second time and shown they have understood it',
      'Tell them you will forgive them once they have proved over a few weeks that they are not going to do it again',
    ],
    tempt: 'Saying it is fine tempts hardest, because it is the kind option and it ends the discomfort immediately. It also makes the next conversation harder, since you have now said a thing that is not true and they will believe it.',
  },
  {
    scene: 'A friend says: "I said sorry, so you have to stop bringing it up."',
    correct: 'An apology does not come with a deadline attached, and asking for one turns it back into a demand',
    wrong: [
      'They have a point — an apology was given, so continuing to raise it is not really fair on them at this stage',
      'Agree to stop mentioning it out loud, and keep track privately of whether anything actually changes from now on',
      'Tell them that they do not get to apologise at all if they are going to be like that about it afterwards',
    ],
    tempt: 'The first wrong option is the one to watch, because it sounds even-handed and is a very common view. An apology is something you owe, not a payment that buys silence — and "you have to stop" is a demand wearing an apology\'s clothes.',
  },
  {
    scene: 'You want to apologise, but the person has asked for some space first.',
    correct: 'Send one short line saying you will wait for as long as it takes, and then actually wait',
    wrong: [
      'Send the full apology now anyway, since they should at least know that you understand what you did wrong',
      'Say nothing at all until they come to you, because they did ask for space and anything else ignores that',
      'Ask a mutual friend to let them know that you are sorry and that you are waiting until they are ready',
    ],
    tempt: 'Sending it anyway tempts because the apology is sincere and holding it feels like doing nothing. Delivering it now serves the sender: it is the request for space overruled by the person who caused the problem.',
  },
  {
    scene: 'You apologised, they said "it\'s fine", and nothing about it feels fine.',
    correct: 'Ask once what would actually help, and then take whatever answer you are given at face value',
    wrong: [
      'Take them at their word, since they said it was fine and pushing further would only make things more awkward',
      'Keep raising it every few days until it genuinely does feel normal again between the two of you',
      'Do something big and thoughtful for them instead, so that they can see that you understood how much it mattered',
    ],
    tempt: 'The grand gesture tempts because it feels like more effort than a question. It is also unrequested, which means it is your idea of repair rather than theirs, and it puts them under a new obligation to be pleased.',
  },
  {
    scene: 'Someone apologises for the same thing every few weeks and nothing about it ever changes.',
    correct: 'Nothing is repaired by the words on their own — the change afterwards is what does the repairing',
    wrong: [
      'Accept it again, because they are clearly sorry and refusing an apology would be an unkind thing to do',
      'Stop accepting any apologies from them at all until they have proved that they have properly changed',
      'Tell them that their apologies do not mean anything to you any more, so they may as well stop giving them',
    ],
    tempt: 'Accepting again is the kind-looking option and it is how a loop gets maintained: the apology discharges the discomfort for both of you, so nothing has to change before the next one.',
  },
  {
    scene: 'You are being pressed to accept an apology in front of a group of people.',
    correct: '"I would rather talk about this later, and just the two of us rather than in front of everyone."',
    wrong: [
      'Accept it there and then, because refusing in front of everybody would make the whole thing far more awkward',
      'Say plainly in front of everyone that you do not accept it, so nobody is left with the wrong impression',
      'Leave the room without responding, so that they understand that this was not the moment to bring it up',
    ],
    tempt: 'Accepting in public tempts because the pressure in the room is real and immediate. An audience is what makes it pressure — a repair that needs witnesses is asking for a performance, not a resolution.',
  },
  {
    scene: 'Your apology was accepted a week ago, and you keep finding reasons to bring it up again.',
    correct: 'Stop raising it, because repeating an apology quietly asks the other person to manage your guilt',
    wrong: [
      'Keep checking in about it now and then, since it shows that you are still taking the whole thing seriously',
      'Bring it up one final time and ask them to confirm properly that things really are all right between you',
      'Ask a mutual friend whether they think the other person has actually got over it or is just being polite',
    ],
    tempt: 'Checking in reads as conscientious, and it is the option most people would defend. Each check hands the other person a small job — reassuring you — for a harm they were the one who took.',
  },
  {
    scene: 'You have apologised and offered to fix it, and they have said they would rather you did not.',
    correct: 'Take that as the answer they have given, and do not go ahead and fix it anyway',
    wrong: [
      'Fix it regardless, because the offer was genuine and they will be glad about it once it is actually done',
      'Ask them again in a few days, when they have had time to think about it and might feel differently',
      'Do something else helpful instead, so that the wish to make up for it does not go entirely to waste',
    ],
    tempt: 'Fixing it anyway is the most sincerely meant wrong answer in this whole skill. It overrides a decision they were entitled to make, which repeats the original shape of the harm in a friendlier costume.',
  },
  {
    scene: 'A friend tells you that you owe someone else an apology, and you are not sure you do.',
    correct: 'Find out what actually happened from them first, before deciding anything about what to do',
    wrong: [
      'Apologise anyway, because it costs very little and it will settle the situation down for everybody involved',
      'Refuse, since apologising for something you do not believe you did would not be honest on your part',
      'Ask around the group to find out whether other people also think that you were in the wrong there',
    ],
    tempt: 'Apologising anyway tempts because it is cheap and it ends the discomfort. An apology for something you have not understood cannot say what changes, so it is a social gesture rather than a repair — and it will not survive the second conversation.',
  },
]

const repReady = tpl(
  {
    id: 'h-rep-notready',
    name: 'When they are not ready',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 3,
    variants: REP_READY.length,
    minutes: 3,
  },
  (rng, seed) => {
    const c = cycle(seed, REP_READY)
    return {
      title: 'After the apology',
      prompt: `${c.scene}\n\nWhat is the right move?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask who the next move is for. If it would mainly relieve the person who caused the harm, it is not repair.',
        'Repair is owed, and it is not owed on demand: the person who was hurt sets the clock, and an apology does not buy a deadline.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.tempt} The rule underneath all of these: an apology is a thing you owe, not a move you make to get something back. Once it has been said clearly, the next decision belongs to the other person, including the decision to take a while.`,
    }
  },
)

// --- write one, then check it --------------------------------------------

interface StudioCase {
  scene: string
  model: string
  key: string
  decoys: string[]
  keyWhy: string
  next: { key: string; decoys: string[]; why: string }
}

const REP_STUDIO: StudioCase[] = [
  {
    scene: 'You promised to look over a friend\'s coursework on Sunday and forgot completely. She handed it in unchecked on Monday morning.',
    model:
      'I said I would read it on Sunday and I forgot, and you handed it in without anyone checking it. I am not going to say yes to a deadline I have not written down. If it comes back and there is a resubmission, I will read it the day you get it.',
    key: '"I forgot after saying I would, which left you waiting on me. I\'ll read the resubmission the day it comes back."',
    decoys: [
      '"I am so annoyed with myself about this, I have thought about nothing else since you told me on Monday morning."',
      '"I am sorry if it affected your mark — you did send it quite late on the Saturday, to be fair to me."',
      '"I have said sorry about it now, so can we be all right again? I would rather not have this hanging over us."',
    ],
    keyWhy:
      'It names the specific failure and attaches a change that can be checked next week. The self-critical version is the closest miss: intense feeling reads as remorse, and it quietly asks her to reassure you.',
    next: {
      key: 'Leave it there and do the thing you already said you would do, without raising it again',
      decoys: [
        'Send another, longer apology in the evening so that she can see how seriously you are taking the whole thing',
        'Ask her directly whether the two of you are all right now, so that you know where you stand with each other',
        'Do something else nice for her instead, so that the apology does not end up being the only thing you did',
      ],
      why: 'A one-word reply is not a verdict, and it is not an invitation to try again. Anything you send now is for you; the only move that reaches her is the one you already promised.',
    },
  },
  {
    scene: 'You told two people about something a friend had told you in confidence. He heard about it from one of them.',
    model:
      'I repeated what you told me, to two people, and you found out from someone else. That was yours to tell and I took it. I am not going to pass anything of yours on again, and if you want me to say something to them, I will.',
    key: '"I repeated what you told me in confidence, and I can see why that would make you careful. I won\'t do it again."',
    decoys: [
      '"I genuinely did not think it was a secret — you did not say so at the time, and it came up naturally in conversation."',
      '"I feel absolutely sick about this and I have barely slept, I keep replaying the whole conversation over and over."',
      '"I have apologised for it now, so can we move past it? Everyone finds out about things eventually anyway."',
    ],
    keyWhy:
      'The technicality — "you did not say it was a secret" — is the most tempting failure here, because it may well be accurate. Being right about the rules while apologising for breaking one is what turns an apology into an argument.',
    next: {
      key: 'Accept the short reply as the answer, and stop passing anything of theirs on to anyone',
      decoys: [
        'Explain again exactly how it happened, so that he can see that it was not as deliberate as it probably looks',
        'Ask him whether he has forgiven you, because otherwise you will not know whether it is settled between you',
        'Tell the two people you told to keep it quiet, and then let him know that you have sorted it out for him',
      ],
      why: 'Explaining how it happened is the thing you want to do and the thing he did not ask for. His news travelling further is the harm; the only response that touches it is that it stops with you.',
    },
  },
  {
    scene: 'You lost your temper with your younger brother over something small, in front of his friend. He has been avoiding you for two days.',
    model:
      'I shouted at you over nothing, and I did it in front of your friend, which made it worse. I am going to leave the room when I am at that point instead of taking it out on you. You do not have to talk to me about it today.',
    key: '"I shouted at you over nothing, and I did it in front of your friend. I\'ll walk away and cool down instead."',
    decoys: [
      '"I had the worst possible week and everything had built up, and you did keep going when I asked you to stop."',
      '"I have felt terrible about it for two days and I really need you to know that I am not that kind of person."',
      '"I have said sorry, so can you stop avoiding me? It has been two days and it is making everything awkward."',
    ],
    keyWhy:
      'The bad-week version is the one most people would say out loud, and everything in it may be true. An explanation offered instead of an apology asks to be excused before anything has been owned.',
    next: {
      key: 'Give him the space he asked for, and hold to the thing you said you would change',
      decoys: [
        'Apologise again properly, this time when his friend is not around, so that he knows you really meant it',
        'Ask him what it would take for things to be normal again, since two days is quite a long time for this',
        'Buy him something to make up for it, so that there is more to the apology than just a set of words',
      ],
      why: 'A second apology and a peace offering both ask him to respond. The only part of this that is yours to control is whether it happens again, and that gets demonstrated over weeks rather than said in a sentence.',
    },
  },
  {
    scene: 'You went ahead and changed the group\'s meeting time after one member said clearly that she could not do Thursdays.',
    model:
      'You told us Thursdays do not work and we moved it to Thursday anyway. I was the one who sent the message. I am going to check with everyone who has said they have a clash before anything gets moved again, and I will put it back to Tuesday.',
    key: '"You told me you could not do Thursdays and I moved it anyway, so that was on me. I\'ll put it back where it was."',
    decoys: [
      '"It was really a group decision in the end, and it all happened quite fast in the chat that evening after training."',
      '"I am mortified about this, honestly, I did not even notice until you said something and I have felt awful since."',
      '"I have said sorry in the chat, so are we fine? I do not want the whole group to be weird about a meeting time."',
    ],
    keyWhy:
      'Spreading it across the group is the strongest wrong option, because it is partly true — and it dissolves the one person who can actually fix it into a crowd who cannot.',
    next: {
      key: 'Move it back exactly as you promised, and then say nothing further about it',
      decoys: [
        'Ask the group to confirm that everyone is happy with the change, so that the decision is properly shared out',
        'Message her separately to check that things are all right between the two of you after what happened',
        'Explain to her how the mix-up came about, so that she understands that nobody was ignoring her on purpose',
      ],
      why: 'She raised a clash, not a feeling, and the repair is the calendar. A private check-in converts a practical problem into an emotional one she now has to reassure you about.',
    },
  },
  {
    scene: 'You made a joke about a classmate\'s presentation and the whole room laughed. He has not spoken to you since.',
    model:
      'I made you the joke in front of the class and everyone laughed at it. That was at your expense and I did it for a laugh. I am not going to do that again, and if it helps I will say so in front of the same people.',
    key: '"I made you the joke in front of everyone, and it was you who had to sit there. I won\'t do that again."',
    decoys: [
      '"It was obviously a joke and I think a couple of other people took it a bit more seriously than I ever meant it."',
      '"I did not mean anything by it at all, I make jokes about everyone, it is honestly just the way that I talk to people."',
      '"I have said sorry about it, so can we be normal? I do not want you thinking I am the sort of person who does that."',
    ],
    keyWhy:
      '"It was obviously a joke" is the worst of the three because it corrects his reading of what happened. Telling somebody their reaction was a misunderstanding is a second version of the original harm.',
    next: {
      key: 'Say it in front of the same people who heard the first thing, exactly as offered',
      decoys: [
        'Give him time and see whether it settles down by itself over the next week or so without anything more',
        'Ask him privately whether he wants you to say something, so that he is not put on the spot a second time',
        'Make a point of being friendly to him in front of the group, so that everyone can see it is all fine now',
      ],
      why: 'Asking whether he wants it is a real option and a close call — but the harm was public and the offer was already made, so putting the decision back to him hands him the awkward job you created.',
    },
  },
  {
    scene: 'You borrowed a bike without asking, got a puncture, and put it back without mentioning it.',
    model:
      'I took your bike without asking, I punctured it, and I put it back and said nothing. I am getting the tube replaced this week, and I am not going to take anything of yours without asking first, including when you are not in.',
    key: '"I took it without asking and then punctured it, so you were left without it. I am getting it fixed this week."',
    decoys: [
      '"I was only going to be twenty minutes and you were not even in, so it did not seem like a big thing at the time."',
      '"I have been dreading telling you about this all week, and I nearly said something about four separate times."',
      '"I have owned up and I have said sorry, so can we leave it? It is a puncture at the end of the day."',
    ],
    keyWhy:
      'The "you were not even in" line is a genuine piece of context and a complete non-answer: whether you were noticed has nothing to do with whether you asked.',
    next: {
      key: 'Get it fixed this week exactly as you said you would, without being reminded',
      decoys: [
        'Offer to lend him something of yours in return, so that the two of you are even about the whole thing',
        'Ask whether he is still annoyed, so that you know whether there is anything else you need to do about it',
        'Explain the reason you needed the bike that afternoon, so that it makes more sense why you took it at all',
      ],
      why: 'An even-trade offer changes the subject to fairness, and explaining the reason re-opens the excuse. The offer of repair was the strong part of the apology, and it only counts once it happens.',
    },
  },
]

const repStudio = tpl(
  {
    id: 'h-rep-studio',
    name: 'Write it, then check it',
    skillIds: ['h-repair'],
    bucket: 'insight',
    difficulty: 3,
    variants: REP_STUDIO.length,
    minutes: 5,
    kind: 'multi',
  },
  (rng, seed) => {
    const c = cycle(seed, REP_STUDIO)
    return {
      title: 'Your version, then four others',
      prompt: `${c.scene}`,
      parts: [
        {
          stage: 'Draft',
          prompt:
            'Write the two or three sentences you would actually send. Yours first — nothing is scored, and the model appears once you are done.',
          answer: draft({
            criteria: [
              'Names the specific thing you did, without softening the words',
              'Says what will be different, in a way somebody could check',
              'No "if" — do not apologise for their reaction instead of your action',
              'Does not ask them to be finished, to forgive you, or to reassure you',
            ],
            model: c.model,
            minWords: 20,
            placeholder: 'What I did was… What will be different is…',
          }),
          explanation:
            'Never scored: the app cannot read writing, and marking it would be pretending. Writing it out first is what makes the next part useful — you compare four attempts against something you have already committed to, rather than against a vague sense of what sounds right.',
          hints: [
            'Start with the verb. "I forgot", "I told them", "I took it" — the specific action, in the first four words.',
            'Then one sentence about what changes. If nobody could tell whether you had done it, it is not a change yet.',
            'Read it back and delete any sentence that is about how you feel.',
          ],
        },
        {
          stage: 'Check',
          prompt: 'Now the graded part. Four versions of the same message. Which one meets all three tests?',
          answer: mcq(rng, c.key, c.decoys),
          explanation: `**${c.key}**. ${c.keyWhy}`,
          hints: [
            'Two tests are easy to run: is the specific act named, and is there a change that could be checked?',
            'The third is the one people miss: does it give the other person a job — arguing, reassuring, or hurrying up?',
          ],
        },
        {
          stage: 'Next',
          prompt: 'You send it. The reply is one word: "ok". Nothing else. What now?',
          answer: mcq(rng, c.next.key, c.next.decoys),
          explanation: `**${c.next.key}**. ${c.next.why} A short reply is not a verdict and not a request. The apology has been delivered, so the next thing that carries any information is what you actually do.`,
          hints: [
            'Ask what each option would give the other person to do. Repair does not generate work for the person who was hurt.',
            'One of these options is the thing you already promised. That one is not a gesture, which is what makes it count.',
          ],
        },
      ],
      hints: [
        'The whole test: name the specific thing, say what changes, and do not hand them a job.',
        'Feelings are real and they are not repair. An apology that is mostly about how sorry you feel asks to be comforted.',
        'The last part turns on a rule worth keeping: after it is said, the next move belongs to them.',
      ],
      explanation:
        'A repair that works has two parts — the specific thing, named without softening, and something that will be different afterwards. Everything else in these options is one of the four standard failures: centring your own feelings, making it conditional on their reaction, explaining it as an excuse, or asking to be finished. The evidence behind the two parts is a study where people rated written apologies, so it is evidence about what reads as real rather than about whether anything healed (Lewicki, Polin & Lount, 2016). The change is what does the healing, and it happens after the message.',
    }
  },
)

export const READING_TEMPLATES: ItemTemplate[] = [
  attrEntry,
  attrSort,
  attrMirror,
  attrFact,
  attrVerdict,
  attrGroups,
  projEntry,
  projGap,
  projPlan,
  projCheck,
  projTransfer,
  intEntry,
  intQuestion,
  intBoth,
  intFake,
  intCases,
  repEntry,
  repSort,
  repRank,
  repReady,
  repStudio,
]
