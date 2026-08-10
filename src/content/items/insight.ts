/**
 * Human Insight — perspective-taking, influence DEFENSE, boundaries.
 * Direction is strictly protective: recognizing manipulation to resist it,
 * never operational instruction in manipulating anyone. Scenarios involving
 * real danger break the game frame and point to trusted adults/resources.
 */
import type { ItemTemplate } from '../../domain/types'
import { draft, mcq, multi, tpl } from '../lib'

const emotionVocab = tpl(
  { id: 'h-emotion-vocab', name: 'Precise emotional vocabulary', skillIds: ['h-emotion'], bucket: 'insight', difficulty: 2, variants: 4, minutes: 2 },
  (rng, seed) => {
    const cases = [
      {
        s: 'Jordan studied hard, got the second-best score in class, and can\'t stop thinking about the one person who did better.',
        correct: 'Frustrated envy tangled with pride — two feelings at once',
        wrong: [
          'Straightforward pride in a strong result, with nothing complicating it',
          'Boredom with a subject that stopped being a challenge a while ago',
          'Fear that the next test will go far worse than this one did',
        ],
        note: 'Naming BOTH parts matters: proud of the score, stung by the comparison. Single-word summaries erase the useful half.',
      },
      {
        s: 'Sam agreed to cover a friend\'s chores again, said "no problem", and then slammed two doors on the way out.',
        correct: 'Resentment leaking out after saying yes while meaning no',
        wrong: [
          'Genuine willingness to help, with the doors meaning nothing much',
          'Surprise at being asked again so soon after the last time',
          'Gratitude for a friendship worth going out of their way for',
        ],
        note: 'The mismatch between words and door-slams is the tell — unexpressed "no" tends to exit sideways. The fix is upstream, at the yes.',
      },
      {
        s: 'Alex\'s best friend is moving away in a month. Alex keeps making jokes about it and changing the subject.',
        correct: 'Anticipatory sadness managed by deflection',
        wrong: [
          'Indifference to the move, which the constant joking makes obvious',
          'Anger at the friend for choosing to leave without much warning',
          'Excitement about having somewhere new to visit next year',
        ],
        note: 'Humor is a common carrier for feelings that are too big to hold directly. Reading deflection as indifference misreads the size of the feeling, not its absence.',
      },
      {
        s: 'Riley triple-checks their packed bag the night before the trip they chose and paid for themselves.',
        correct: 'Excited AND anxious — the two often arrive together',
        wrong: [
          'Regret about booking a trip they now wish they had not paid for',
          'Boredom with the waiting, filled up by fiddling with the bag',
          'Anger at whoever talked them into going in the first place',
        ],
        note: 'Arousal is ambiguous: the same racing feeling reads as excitement or anxiety depending on the story attached. Both can be true at once.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Name the feeling precisely',
      prompt: `${c.s}\n\nWhich reading fits best — while staying honest about what is uncertain?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look for TWO feelings — big moments usually carry a blend.',
        'Compare stated words against actions; mismatches carry information (but not certainty).',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Caveat that keeps this honest: these are best READINGS of described behavior, not mind-reading. With a real person, the move after a reading is a question, not a verdict.`,
    }
  },
)

const multipleMinds = tpl(
  { id: 'h-multiple-minds', name: 'Multiple Minds', skillIds: ['h-emotion'], bucket: 'insight', difficulty: 3, variants: 3, minutes: 4.5, kind: 'multi' },
  (rng, seed) => {
    const cases = [
      {
        s: 'You wave at a classmate across the street. They look toward you and walk on without waving.',
        assumesIntent: [
          'They decided to snub me.',
          'They wanted me to notice being ignored.',
          'They have chosen to cool off the friendship.',
        ],
        staysOpen: [
          '"Looked toward" is not the same as "saw" — especially at that distance.',
          'They may not have recognized me out of the context they expect me in.',
          'How they greet me next time we meet normally would tell me more.',
        ],
        model:
          'Plausible minds: (1) Didn\'t actually see you — "looked toward" is not "saw", especially at distance. (2) Saw movement, didn\'t recognize you without expecting you there. (3) Preoccupied — rehearsing something, bad morning. (4) Saw and snubbed you — possible, but it is ONE hypothesis of four, and the only one that assigns intent. What would separate them: their behavior next time you meet normally.',
      },
      {
        s: 'Your group chat goes quiet for a whole evening after you share your project idea.',
        assumesIntent: [
          'They think the idea is bad and are avoiding saying so.',
          'They are deliberately leaving me without an answer.',
          'They have already agreed among themselves to drop it.',
        ],
        staysOpen: [
          'On a weekday evening, silence is the default state of a group chat.',
          'A substantive reply costs more effort than an emoji, so it waits.',
          'The message may simply be buried under later ones.',
        ],
        model:
          'Plausible minds: (1) Evening — people are at practice, dinner, homework; silence is the default, not a verdict. (2) They\'re thinking it over; substantive replies cost more than emoji. (3) They missed it under other messages. (4) They dislike it and are unsure how to say so. Only (4) is about the idea\'s quality, and the morning replies will separate the worlds cheaply.',
      },
      {
        s: 'The teacher returns everyone\'s quiz but asks you to stay after class.',
        assumesIntent: [
          'They are keeping me back to tell me off.',
          'They want to single me out in front of the class.',
          'They have decided there is a problem with my work.',
        ],
        staysOpen: [
          'An unusual answer can prompt curiosity as easily as concern.',
          'It may be logistics — a form, a schedule, a signature.',
          'Whatever it is, the information arrives at the same moment either way.',
        ],
        model:
          'Plausible minds: (1) A question about an unusual answer — curiosity, not accusation. (2) They noticed improvement or want to suggest a competition/advanced material. (3) Logistics: a form, a schedule issue. (4) A concern about the quiz. Pre-living only scenario (4) for the whole class period costs real attention and settles nothing — the information arrives at the same time either way.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Hold several readings at once',
      prompt: `${c.s}`,
      parts: [
        {
          stage: 'Readings',
          prompt:
            'Write three genuinely different explanations for their behavior, at most one involving hostility toward you. Write yours first — the model appears once you are done.',
          answer: draft({
            criteria: [
              'Three explanations with genuinely different causes',
              'At most one involving hostility or judgment of me',
              'At least one purely situational (timing, logistics, chance)',
              'The evidence that would separate the explanations, named',
            ],
            model: c.model,
            minWords: 25,
            placeholder: 'Reading 1… Reading 2… Reading 3… What would tell them apart…',
          }),
          explanation:
            'Rotating the cause — perception, situation, inner state, and only then intent-about-you — is the habit being trained. This draft is yours; nothing here is scored.',
        },
        {
          stage: 'Check',
          prompt:
            'Now the graded part. Select every reading below that **assumes you already know what the other person intended**.',
          answer: multi(rng, c.assumesIntent, c.staysOpen),
          explanation:
            'A reading that assigns intent has quietly closed the question. The open readings keep more than one world alive and point at the cheap observation that would separate them — which is what makes them useful rather than merely charitable.',
        },
      ],
      hints: [
        'Rotate the causes: perception (did they even see/read it?), situation, their inner state, and only then intent-about-you.',
        'The self-centered reading feels most TRUE because it is most VIVID — that is a property of your attention, not of their mind.',
        'For the check: if a reading states what they meant, it assumes intent — even a kind one does.',
      ],
      explanation: `Model: ${c.model} The skill is holding readings as open hypotheses. It protects you twice: from needless hurt when the boring explanation is true, and from missing real signals — because testing beats assuming in both directions.`,
    }
  },
)

const influenceFirewall = tpl(
  { id: 'h-influence-firewall', name: 'Influence Firewall', skillIds: ['h-influence'], bucket: 'insight', difficulty: 3, variants: 5, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        s: '"This deal ends in 10 minutes! Everyone in your class already claimed theirs. Don\'t be the one who missed out!"',
        correct: 'Manufactured urgency plus social-proof pressure',
        wrong: [
          'A neutral factual reminder that the offer window is closing soon',
          'A personalised recommendation based on what classmates actually bought',
          'A standard legal disclosure of the terms attached to the deal',
        ],
        note: 'Two levers at once: an artificial clock (real deadlines survive questions; fake ones melt) and an unverifiable "everyone". Defense: name the tactic, then decide on the product\'s merits at YOUR pace — anything that punishes thinking time is selling the pressure, not the product.',
      },
      {
        s: '"After everything I\'ve done for you, you\'d really say no to this one little favor?"',
        correct: 'Guilt leverage converting past kindness into present obligation',
        wrong: [
          'A fair reminder of a real debt that genuinely is still outstanding',
          'An apology for having to ask for something at an awkward moment',
          'A neutral request that simply mentions their history together',
        ],
        note: 'Real generosity does not invoice later. The frame makes "no" feel like betrayal — that FEELING is the tactic. Defense: "I\'m glad we help each other; I still can\'t do this one." Both clauses true.',
      },
      {
        s: '"You\'re honestly the smartest person I know. So you\'ll help me with — well, actually just do — this assignment, right?"',
        correct: 'Flattery priming a request that shifted mid-sentence',
        wrong: [
          'A sincere compliment with no strings, followed by a separate question',
          'A fair trade offer in which both people get something they wanted',
          'Constructive feedback about how capable they think you have become',
        ],
        note: 'The compliment builds a small debt; the ask then MOVES (help → do it for me) hoping the glow carries over. Defense: separate the two — "thanks — and I can explain it, not do it."',
      },
      {
        s: '"Just sign up for the free trial — you can cancel anytime. (Cancellation available by phone, weekdays 9–11 am, after a retention interview.)"',
        correct: 'A dark pattern: easy entry, deliberately costly exit',
        wrong: [
          'A generous free offer that they expect most people to keep paying for',
          'A standard security measure protecting the account from casual misuse',
          'A misprint in the help pages that nobody has got round to correcting',
        ],
        note: 'The asymmetry IS the design: friction placed exactly where leaving happens. Defense: judge subscriptions by their exit before entering; calendar the cancel date at signup.',
      },
      {
        s: '"Quick — your account will be deleted TODAY unless you verify your password at this link. Do not tell anyone, IT policy."',
        correct: 'Phishing: urgency + secrecy + credential request — the triple red flag',
        wrong: [
          'A routine IT notice of the kind organisations send out several times a year',
          'A helpful security upgrade that genuinely does need confirming quickly',
          'A harmless survey asking people to verify which account details are current',
        ],
        note: 'Urgency prevents thinking, secrecy prevents checking, and no legitimate service asks for your password by link. Defense: never act on the message\'s own channel — go to the real site/app directly, and DO tell someone; "don\'t tell anyone" is itself the loudest alarm.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Name the tactic',
      prompt: `You receive this:\n\n> ${c.s}\n\nWhat is the influence tactic?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Check the three levers: time pressure, social pressure, emotional debt.',
        'Ask what the message PREVENTS: thinking time, checking with others, or comparing options.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Naming a tactic collapses most of its power — pressure works best unexamined. This lab only ever trains the defense.`,
    }
  },
)

const boundary = tpl(
  { id: 'h-boundary', name: 'Boundary Rehearsal', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 3, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        s: 'A friend keeps copying your homework "just this once" — for the fourth week straight. You want it to stop without ending the friendship.',
        correct: '"I\'m not sharing my homework anymore. If you\'re stuck, I\'ll walk you through the first problem."',
        wrong: [
          '"Fine, but this is the ABSOLUTE last time" (again)',
          'Silently write two versions with mistakes in theirs',
          'Tell everyone else in the class so that they put pressure on your friend for you',
        ],
        note: 'Clear no + genuine alternative = boundary WITH warmth. The repeated "last time" teaches that your no is a delay; the sabotage and gossip options attack the person instead of the pattern.',
      },
      {
        s: 'At a sleepover, the group wants to watch something you find genuinely disturbing. "Don\'t be a baby" is already circulating.',
        correct: '"Not for me — I\'ll sit out this one and rejoin for the next thing."',
        wrong: [
          'Watch it and feel sick to avoid the label',
          'Demand they change it or you\'re calling your parents right now',
          'Mock the movie until nobody can enjoy it',
        ],
        note: 'A boundary states YOUR limit without controlling THEIR choice. "Don\'t be a baby" is a compliance lever — a calm, unapologetic sit-out defuses it; escalation and sabotage hand the evening to conflict.',
      },
      {
        s: 'A teammate "jokingly" puts down your play in front of everyone, every practice. Today: "relax, it\'s a joke."',
        correct: '"Jokes we both laugh at are fine. This one I\'ve asked you to drop — drop it."',
        wrong: [
          'Laugh along with it again and then vent about how annoying they are online later',
          'Put down their play harder next time',
          'Quit the team without saying why',
        ],
        note: '"It\'s a joke" retroactively reclassifies a jab as your oversensitivity. The named boundary separates real humor (mutual) from disguised aggression (one-way) — and the public repetition is what makes a clear public "drop it" proportionate.',
      },
      {
        s: 'Someone you know mostly online asks you to keep secrets from your parents and gets angry when you\'re slow to reply.',
        correct: 'Stop engaging, keep the messages, and tell a parent or trusted adult now — secrecy demands from adults or near-strangers are a serious warning sign',
        wrong: [
          'Apologize and reply faster so they calm down',
          'Keep it secret as asked — it\'s probably fine',
          'Handle it alone by arguing back until they lose interest and leave you be',
        ],
        note: 'This is not a boundary-phrasing exercise — it is a recognized grooming pattern (secrecy + urgency + isolation from adults). The right move is not a better sentence; it is exiting the conversation and bringing in a trusted adult immediately. If anyone pressures you toward secrecy from your parents, that pressure itself is the alarm.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Say the line',
      prompt: `${c.s}\n\nWhat is the strongest response?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A boundary = your limit + what you WILL do — no insult, no essay, no apology tour.',
        'Check for the pattern-breaker: does the response change the repeating game, or feed it another round?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

const deescalate = tpl(
  { id: 'h-deescalate', name: 'Composure Protocol', skillIds: ['h-boundary', 'h-emotion'], bucket: 'insight', difficulty: 3, variants: 3, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        s: 'Group project, week of the deadline. A teammate snaps at you in front of everyone: "Maybe if YOU did anything, we\'d be done!"',
        correct: 'Steady voice: "That landed hard. Let\'s list who\'s got what — if something of mine is missing, I\'ll own it."',
        wrong: [
          'Return fire with their worst missed deadline',
          'Walk out of the meeting mid-sentence',
          'Absorb it silently, say nothing at all, and seethe quietly for the rest of the project',
        ],
        note: 'Acknowledge the heat, move to verifiable specifics, accept accountability if real. Counter-attacking converts one person\'s outburst into a two-person fight; silent absorption just schedules the explosion for later.',
      },
      {
        s: 'Your younger sibling, furious about their broken game, is escalating at you though you didn\'t touch it.',
        correct: 'Low and slow: "You\'re really upset. I didn\'t touch it — want help figuring out what happened?"',
        wrong: [
          'Match their volume so they learn how it feels',
          '"Calm down, it\'s literally just a game"',
          'List every single time that they have broken something of YOURS in the past',
        ],
        note: 'Volume is contagious in both directions — going low and slow is the lever. "Calm down" plus minimizing ("just a game") reliably escalates: it dismisses the feeling while ordering its removal. The scoreboard option reopens every old fight at once.',
      },
      {
        s: 'Online: someone comments an insult on your post, and two others are already piling on.',
        correct: 'Don\'t feed it — no reply, mute or block, and talk to someone you trust if it continues or moves to harassment',
        wrong: [
          'Craft the perfect devastating comeback and wait for the right moment to post it',
          'Screenshot it to a bigger account to shame them',
          'Post an angry story about "some people"',
        ],
        note: 'Pile-ons feed on response — attention is the fuel. The comeback and the shame-amplification both grow the audience; the vague-post keeps you marinating in it. Exit, mute, and escalate to a trusted adult/report tools if it turns into harassment — that is strength, not surrender.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Cool it down',
      prompt: `${c.s}\n\nWhat actually de-escalates this?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'First move is internal: one breath, drop your volume below theirs.',
        'Validate the feeling, then steer to specifics or exit — never argue the feeling itself.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Composure is not passivity — it is refusing to let someone else\'s spike set your nervous system, so the next move is CHOSEN.`,
    }
  },
)

const claimEvidenceIntent = tpl(
  { id: 'h-claim-evidence-intent', name: 'Claim – Evidence – Intent', skillIds: ['h-influence'], bucket: 'insight', difficulty: 3, variants: 2, minutes: 3, transfer: true },
  (_rng, seed) => {
    const sets = [
      {
        intro: 'An influencer\'s video about a "focus supplement":',
        statements: [
          { text: '"This powder doubled my focus in a week"', category: 0 },
          { text: 'A screenshot of one user\'s 5-star review', category: 1 },
          { text: '"Use my code for 20% off — today only"', category: 2 },
          { text: '"Scientists say focus is the #1 skill" (no source shown)', category: 0 },
          { text: 'A before/after study-session timelapse, edited by the seller', category: 1 },
          { text: 'The affiliate-link disclosure in tiny text', category: 2 },
        ],
        note: 'The "evidence" here is one review and a seller-edited video — worth almost nothing against the claims. The intent items (code, affiliate link) explain WHY the weak evidence is dressed up so confidently.',
      },
      {
        intro: 'A flyer urging your school to buy "SmartDesk" standing desks:',
        statements: [
          { text: '"Standing desks raise grades"', category: 0 },
          { text: 'A bar chart from a study of 12 students at one school', category: 1 },
          { text: '"Order before June for bulk pricing"', category: 2 },
          { text: '"Every modern school is switching"', category: 0 },
          { text: 'A quote from one teacher who liked them', category: 1 },
          { text: 'The flyer is published by the desk manufacturer', category: 2 },
        ],
        note: 'n=12 and one testimonial cannot carry "raises grades" and "every school". The manufacturer authorship reframes the whole flyer: it is an ad wearing a study\'s clothes.',
      },
    ]
    const s = sets[seed % sets.length]
    return {
      title: 'Sort the message',
      prompt: `${s.intro}\n\nLabel each element: **Claim** (what they assert), **Evidence** (what they show), or **Intent** (what they want from you).`,
      answer: { type: 'classify', categories: ['Claim', 'Evidence', 'Intent'], statements: s.statements },
      hints: [
        'Claims assert; evidence can be checked; intent is what happens if you comply.',
        'Weigh evidence AGAINST the claims it must carry — and let the intent explain any gap.',
        'Worked path: the labels are in the explanation.',
      ],
      explanation: `${s.statements.map((st) => `**${['Claim', 'Evidence', 'Intent'][st.category]}**: ${st.text}`).join('. ')}. ${s.note} This three-way sort is the fastest general-purpose filter for persuasion of every kind.`,
    }
  },
)

const trustedPerson = tpl(
  { id: 'h-trusted-person', name: 'When to bring in an adult', skillIds: ['h-boundary', 'h-influence'], bucket: 'insight', difficulty: 3, variants: 2, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        s: 'A classmate has been sending a smaller kid threatening messages, and today mentioned "making them pay" tomorrow. You saw the messages yourself.',
        correct: 'Tell a teacher or parent today — specific threats with a timeframe are beyond peer handling',
        wrong: [
          'Wait to see if anything actually happens tomorrow',
          'Confront the classmate yourself to look out for the kid',
          'Post the screenshots publicly so that everyone knows exactly what was said',
        ],
        note: 'A specific threat + timeline is an adult-now situation, full stop. Waiting gambles someone else\'s safety; solo confrontation adds you to the incident; public posting spreads it without protecting anyone. Reporting a credible threat is not snitching — it is the job of the person who saw it.',
      },
      {
        s: 'A friend has been talking about feeling hopeless, gave away a favorite possession yesterday, and today said "none of it will matter soon."',
        correct: 'Take it seriously and tell a trusted adult right away — and if you\'re in the US, you or your friend can call or text 988 (Suicide & Crisis Lifeline) anytime',
        wrong: [
          'Keep their trust by telling no one, as they\'d want',
          'Assume it\'s a phase everyone goes through',
          'Send some encouraging messages and quotes, then check back in with them next week',
        ],
        note: 'Hopelessness + giving away possessions + "won\'t matter soon" is a pattern to treat as urgent, not to diagnose yourself. This is the one secret you never keep: real friends get adults involved. In the US, call/text 988; if danger is immediate, 911. Telling was the loyal move.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'This one is not a game',
      prompt: `${c.s}\n\nWhat do you do?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Sort by stakes: reversible social stuff is for peers; safety is for adults, immediately.',
        'The test: if this went wrong tomorrow, would "I kept it to myself" be defensible?',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

export const INSIGHT_TEMPLATES: ItemTemplate[] = [
  emotionVocab,
  multipleMinds,
  influenceFirewall,
  boundary,
  deescalate,
  claimEvidenceIntent,
  trustedPerson,
]
