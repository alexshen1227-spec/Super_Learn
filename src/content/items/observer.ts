/**
 * Observer Lab — observation vs inference, recall, listening, calibration.
 * Safety boundaries: fictional scenes only; teaches SELF-calibration and
 * defense against cold reading; never "reading people", lie-detection
 * "tells", profiling, or practicing on non-consenting people.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, tpl } from '../lib'

// ---------- Evidence Ledger: Observed / Inferred / Unknown ----------

const LEDGER_SCENES = [
  {
    scene:
      'You enter the school library at 3:10 pm. A backpack sits alone on table 4 with a half-finished math worksheet beside it. A pencil lies on the floor under the chair. The window next to the table is open and the curtain is moving.',
    statements: [
      { text: 'A backpack is on table 4', category: 0 },
      { text: 'The backpack\'s owner left in a hurry', category: 1 },
      { text: 'The worksheet is half finished', category: 0 },
      { text: 'The student found the math difficult', category: 2 },
      { text: 'Air is moving the curtain', category: 1 },
      { text: 'The window is open', category: 0 },
    ],
    note: 'The hurry story FITS the scene but so does "went to the shelf for a book". The moving curtain makes air movement a strong inference — but you observed the motion, not the air.',
  },
  {
    scene:
      'At the bus stop, a person in a rain jacket checks their phone three times in one minute. The pavement is wet. A folded umbrella leans against the bench. The display board shows the 3:42 bus as "delayed".',
    statements: [
      { text: 'The pavement is wet', category: 0 },
      { text: 'It rained recently', category: 1 },
      { text: 'The person is anxious about being late', category: 2 },
      { text: 'The display shows the 3:42 as delayed', category: 0 },
      { text: 'The person checked their phone three times', category: 0 },
      { text: 'The umbrella belongs to the person in the rain jacket', category: 2 },
    ],
    note: 'Wet pavement + umbrella makes rain a reasonable inference (a street cleaner is possible). The anxiety story and umbrella ownership go beyond anything seen.',
  },
  {
    scene:
      'In the kitchen, a mixing bowl holds batter. The oven display reads 180°. A timer on the counter shows 12:40 counting down. Flour dust covers one section of the counter, and a recipe book lies open to a page titled "Banana Bread".',
    statements: [
      { text: 'The oven display reads 180°', category: 0 },
      { text: 'Someone is baking banana bread', category: 1 },
      { text: 'The recipe book is open to "Banana Bread"', category: 0 },
      { text: 'The baker is an experienced cook', category: 2 },
      { text: 'The timer is counting down from 12:40', category: 0 },
      { text: 'The batter in the bowl is banana bread batter', category: 1 },
    ],
    note: 'The open recipe + batter + heated oven make "baking banana bread" a strong inference — but the bowl\'s contents were never verified. Skill level is pure speculation.',
  },
  {
    scene:
      'A note on the fridge reads "back at 6 — walk Biscuit please!" in blue ink. A dog leash hangs by the door. A food bowl on the floor is empty. The clock reads 5:15.',
    statements: [
      { text: 'The note says "back at 6"', category: 0 },
      { text: 'Biscuit is a dog', category: 1 },
      { text: 'The food bowl is empty', category: 0 },
      { text: 'Biscuit has not been fed today', category: 2 },
      { text: 'The writer of the note will return at exactly 6:00', category: 2 },
      { text: 'A leash hangs by the door', category: 0 },
    ],
    note: 'Leash + "walk" makes the dog inference strong. But an empty bowl does not reveal WHEN it was emptied, and notes state intentions, not guarantees.',
  },
]

const evidenceLedger = tpl(
  {
    id: 'o-evidence-ledger',
    name: 'Evidence Ledger',
    skillIds: ['o-obsinf'],
    bucket: 'observer',
    difficulty: 2,
    variants: LEDGER_SCENES.length,
    minutes: 3,
    calibration: true,
  },
  (_rng, seed) => {
    const s = LEDGER_SCENES[seed % LEDGER_SCENES.length]
    return {
      title: 'Observed, inferred, or unknown?',
      prompt: `Read the scene, then label each statement.\n\n> ${s.scene}\n\n**Observed** = directly stated in the scene. **Inferred** = strongly supported but not stated. **Unknown** = the scene cannot settle it.`,
      answer: { type: 'classify', categories: ['Observed', 'Inferred', 'Unknown'], statements: s.statements },
      hints: [
        'Test each statement: can you point to the exact words in the scene that state it?',
        'If you need a story to connect the scene to the statement, it is at best an inference — and if several stories fit equally, it is unknown.',
        `Worked path: ${s.statements.map((st) => `"${st.text}" → ${['Observed', 'Inferred', 'Unknown'][st.category]}`).join('; ')}.`,
      ],
      explanation: `${s.statements.map((st) => `**${['Observed', 'Inferred', 'Unknown'][st.category]}**: ${st.text}`).join('. ')}. ${s.note} Keeping these three levels separate is the foundation of reliable observation — most reasoning errors smuggle inferences in as facts.`,
    }
  },
)

// ---------- Scene Recall (study → questions) ----------

const RECALL_SCENES = [
  {
    study:
      'THE DESK. A green notebook sits on the left corner. Three pencils — two yellow, one red — lie in the center tray. A silver water bottle stands behind a stack of four textbooks. A sticky note on the lamp reads "call Sam". The lamp is off.',
    parts: [
      { prompt: 'How many pencils were in the tray?', answer: { type: 'mcq' as const, options: ['Two', 'Three', 'Four', 'Five'], correct: 1 }, explanation: 'Three pencils: two yellow, one red.' },
      { prompt: 'What did the sticky note say?', answer: { type: 'mcq' as const, options: ['"call Sam"', '"text Sam"', '"call Max"', '"meet Sam"'], correct: 0 }, explanation: 'The note read "call Sam" — verbatim recall of short text is a distinct skill from gist recall.' },
      { prompt: 'Which detail was NOT in the scene?', answer: { type: 'mcq' as const, options: ['A phone charger', 'A green notebook', 'A silver water bottle', 'A stack of textbooks'], correct: 0 }, explanation: 'No charger was mentioned. Rejecting plausible-but-absent details is where memory is weakest — familiarity feels like memory.' },
    ],
  },
  {
    study:
      'THE HALLWAY. Locker 118 is open with a blue jacket hanging inside. A poster for the science fair (Friday, Gym B) hangs slightly tilted. Two students walk past carrying one cardboard box each. The floor near the water fountain is marked with a yellow "wet floor" cone.',
    parts: [
      { prompt: 'Which locker was open?', answer: { type: 'mcq' as const, options: ['118', '181', '811', '112'], correct: 0 }, explanation: 'Locker 118. Numbers scramble easily in memory — encoding them as a pattern ("one-one-eight") helps.' },
      { prompt: 'Where is the science fair?', answer: { type: 'mcq' as const, options: ['Gym B', 'Gym A', 'The library', 'Room 118'], correct: 0 }, explanation: 'Gym B, on Friday — the poster carried two facts and interference between them is common.' },
      { prompt: 'How many boxes were being carried in total?', answer: { type: 'mcq' as const, options: ['Two', 'One', 'Three', 'Four'], correct: 0 }, explanation: 'Two students × one box each = two boxes. The question tests whether you encoded the structure, not just the words.' },
    ],
  },
  {
    study:
      'THE BUS. Seat 7 holds a forgotten red scarf. The driver wears a gray cap. An ad above the window advertises "Lakeside Dental — smile brighter". A child in the front row holds a picture book about dinosaurs. The time on the display reads 8:14.',
    parts: [
      { prompt: 'What was on seat 7?', answer: { type: 'mcq' as const, options: ['A red scarf', 'A blue scarf', 'A red hat', 'A backpack'], correct: 0 }, explanation: 'A red scarf — binding the color to the object to the location is the encoding challenge.' },
      { prompt: 'What was the ad for?', answer: { type: 'mcq' as const, options: ['A dental clinic', 'A car dealership', 'A swim school', 'A bookstore'], correct: 0 }, explanation: '"Lakeside Dental". Gist ("some ad") comes free; the CONTENT requires deliberate attention.' },
      { prompt: 'What time did the display show?', answer: { type: 'mcq' as const, options: ['8:14', '8:41', '9:14', '8:04'], correct: 0 }, explanation: '8:14 — the distractors are digit-swaps, the exact way time memories corrupt.' },
    ],
  },
]

const sceneRecall = tpl(
  {
    id: 'o-scene-recall',
    name: 'Scene Recall',
    skillIds: ['o-recall'],
    bucket: 'observer',
    difficulty: 2,
    variants: RECALL_SCENES.length,
    minutes: 4,
    kind: 'multi',
    calibration: true,
  },
  (_rng, seed) => {
    const s = RECALL_SCENES[seed % RECALL_SCENES.length]
    return {
      title: 'Study, then recall',
      prompt: 'Study the scene below. When it disappears, you will answer three questions from memory.',
      parts: [
        { study: s.study, studySeconds: 40, prompt: s.parts[0].prompt, answer: s.parts[0].answer, explanation: s.parts[0].explanation },
        { prompt: s.parts[1].prompt, answer: s.parts[1].answer, explanation: s.parts[1].explanation },
        { prompt: s.parts[2].prompt, answer: s.parts[2].answer, explanation: s.parts[2].explanation },
      ],
      hints: [
        'Before reading, decide what to encode: objects + locations + exact words.',
        'Group details into a walk-through: corner → center → behind → on top.',
        'No worked path exists for memory — check the explanation after answering.',
      ],
      explanation:
        'Recall improves when encoding is STRUCTURED: sweep the scene in one spatial order, name exact numbers/words to yourself, and expect a "which detail was absent?" test — that expectation alone sharpens encoding. Note your misses: colors? numbers? exact words? That pattern tells you what to encode harder next time.',
    }
  },
)

// ---------- Change Laboratory ----------

const CHANGE_SCENES = [
  {
    before:
      'Café table: a white mug on a saucer, a folded newspaper, a phone face-down, sugar packets in a jar, a spoon to the right of the mug.',
    after:
      'Café table: a white mug on a saucer, a folded newspaper, a phone face-UP, sugar packets in a jar, a spoon to the right of the mug.',
    correct: 'The phone flipped from face-down to face-up',
    wrong: ['The spoon moved to the left side', 'The newspaper was unfolded', 'A sugar packet was removed'],
  },
  {
    before:
      'Bookshelf: five books upright (red, blue, green, yellow, black from left to right), a globe on top, a plant to the right of the shelf, a clock reading 2:00.',
    after:
      'Bookshelf: five books upright (red, GREEN, BLUE, yellow, black from left to right), a globe on top, a plant to the right of the shelf, a clock reading 2:00.',
    correct: 'Two books swapped positions (blue and green)',
    wrong: ['The clock changed to 3:00', 'The plant moved to the left side', 'The globe was removed'],
  },
  {
    before:
      'Park bench: a skateboard leaning on the left armrest, two pigeons on the path, a trash bin with a closed lid, a streetlamp that is off.',
    after:
      'Park bench: a skateboard leaning on the left armrest, THREE pigeons on the path, a trash bin with a closed lid, a streetlamp that is off.',
    correct: 'The number of pigeons changed from two to three',
    wrong: ['The skateboard moved to the right armrest', 'The trash bin lid opened', 'The streetlamp turned on'],
  },
]

const changeLab = tpl(
  {
    id: 'o-change-lab',
    name: 'Change Laboratory',
    skillIds: ['o-recall', 'o-obsinf'],
    bucket: 'observer',
    difficulty: 3,
    variants: CHANGE_SCENES.length,
    minutes: 3,
    kind: 'multi',
  },
  (rng, seed) => {
    const s = CHANGE_SCENES[seed % CHANGE_SCENES.length]
    return {
      title: 'What changed?',
      prompt: 'Study the first version. Then compare against the second version from memory.',
      parts: [
        {
          study: `VERSION 1 — ${s.before}`,
          studySeconds: 30,
          prompt: `VERSION 2 — ${s.after}\n\nWhat changed?`,
          answer: mcq(rng, s.correct, s.wrong),
          explanation: `**${s.correct}**. Change blindness is the norm, not a flaw: unattended details do not persist. A deliberate sweep (objects → positions → counts → states) catches what casual looking misses.`,
        },
      ],
      hints: [
        'Encode: objects, positions, counts, and on/off states — four separate passes.',
        'On comparison, check each category one at a time instead of "feeling" for difference.',
        'No worked path for memory — the explanation follows your answer.',
      ],
      explanation: `**${s.correct}**. Comparing scenes reliably requires encoding the FIRST scene deliberately — you cannot compare against a memory you never stored.`,
    }
  },
)

// ---------- Contradiction Hunt ----------

const contradictionHunt = tpl(
  { id: 'o-contradiction', name: 'Contradiction Hunt', skillIds: ['o-obsinf', 'o-listen'], bucket: 'observer', difficulty: 3, variants: 4, minutes: 3 },
  (rng, seed) => {
    const cases = [
      {
        account:
          'A classmate describes their weekend: "Saturday I biked to the lake at noon and stayed till dark. It was pouring rain all day, which made the trails slow. Sunday my bike was in the shop, so I biked to Sam\'s place in the morning."',
        correct: 'Sunday: the bike was in the shop, yet they biked to Sam\'s',
        wrong: [
          'Saturday: you cannot bike to a lake at noon',
          'Rain and slow trails contradict each other',
          'Staying till dark contradicts leaving at noon',
        ],
        note: 'The rain detail is consistent (rain genuinely slows trails); the real clash is using a bike that is simultaneously in the shop.',
      },
      {
        account:
          '"The bakery is closed every Monday. I stopped by this Monday and bought their fresh sourdough — the owner said it had just come out of the oven at 7 am."',
        correct: 'Buying bread on Monday contradicts "closed every Monday"',
        wrong: [
          'Sourdough cannot be baked by 7 am',
          'Owners do not work at their own bakeries',
          'Fresh bread contradicts being bought',
        ],
        note: 'Every other detail is plausible on its own — the contradiction is between the schedule rule and the visit.',
      },
      {
        account:
          '"Our team has never lost a home game this season. The stands were packed for all nine of them — including the one we dropped by two points in overtime last month."',
        correct: '"Never lost at home" contradicts "the one we dropped in overtime"',
        wrong: [
          'Nine home games is impossible in one season',
          'Overtime games cannot be lost by two points',
          'Packed stands contradict a small school',
        ],
        note: '"Dropped" quietly means "lost" — contradictions often hide behind a synonym.',
      },
      {
        account:
          '"I only found out about the surprise party when everyone yelled surprise. I\'d spent that morning helping my sister blow up balloons for it, so I made sure to act shocked."',
        correct: 'Helping set up in the morning contradicts only finding out at the yell',
        wrong: [
          'Balloons cannot be inflated in a morning',
          'Sisters would not plan parties together',
          'Acting shocked is impossible if truly surprised',
        ],
        note: 'The speaker even says "act shocked" — the account defeats itself once the timeline is laid out.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Find the contradiction',
      prompt: `Read the account carefully:\n\n> ${c.account}\n\nWhich two details cannot both be true?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Lay the details on a timeline; contradictions are usually two claims about the same time or rule.',
        'Ignore the vivid details — check the LOGISTICS: who, where, when, with what.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Note what this skill is for: checking STORIES for internal consistency — it says nothing about whether a PERSON is lying, which single details cannot establish.`,
    }
  },
)

// ---------- Three Explanations ----------

const threeExplanations = tpl(
  { id: 'o-three-explanations', name: 'Three Explanations', skillIds: ['o-obsinf', 'o-bias'], bucket: 'observer', difficulty: 3, variants: 4, minutes: 4 },
  (_rng, seed) => {
    const cases = [
      {
        obs: 'Your friend has not replied to your message for a full day, though the app shows it was delivered.',
        model:
          '1) Busy or overwhelmed (exams, family, phone confiscated). 2) Saw it, meant to reply, forgot — the delivered-flag says nothing about attention. 3) Notification never surfaced (silent mode, app glitch). A fourth, upset-with-you, is possible but NOT favored by this evidence alone.',
      },
      {
        obs: 'A usually-talkative classmate sat silently through the whole group project meeting.',
        model:
          '1) Something outside school is weighing on them. 2) They dislike this project or their assigned part. 3) They were simply tired or unwell. The observation alone cannot pick between these — and "they are mad at me" adds an assumption the scene never supplied.',
      },
      {
        obs: 'The teacher moved your seat to the front of the class without explanation.',
        model:
          '1) A whole-class reshuffle you noticed only your part of. 2) Practical logistics: sightlines, a chatty pairing being split, board visibility. 3) The teacher wants to support your focus. "I am in trouble" is one MORE hypothesis — not the default.',
      },
      {
        obs: 'Your bike, which you always park by the fence, is leaning against the wall instead.',
        model:
          '1) Someone moved it to reach something behind the fence. 2) You parked it differently while distracted — memory of routine actions is weak. 3) Maintenance/cleaning required moving everything. "Someone tried to steal it" needs more evidence than a changed position.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Generate three explanations',
      prompt: `Observation: **${c.obs}**\n\nWrite **three different plausible explanations**, then check yourself against the criteria.`,
      answer: {
        type: 'rubric',
        criteria: [
          'I wrote three genuinely different explanations (not one story reworded)',
          'At least one explanation involves no one doing anything wrong',
          'None of my explanations claims to know another person\'s private thoughts as fact',
          'I could name evidence that would separate my explanations',
        ],
        model: c.model,
      },
      hints: [
        'Vary the AGENT: one explanation about circumstances, one about routine/chance, one about intent.',
        'The most useful third explanation is usually the boring one.',
        'Compare against the model after scoring yourself.',
      ],
      explanation: `Model answers: ${c.model} The reflex being trained: hold multiple stories loosely instead of marrying the first one — the first story is usually about YOU, and the evidence usually is not.`,
    }
  },
)

// ---------- Memory Palace ----------

const memoryPalace = tpl(
  {
    id: 'o-memory-palace',
    name: 'Memory Palace',
    skillIds: ['o-memory'],
    bucket: 'observer',
    difficulty: 2,
    variants: 3,
    minutes: 5,
    kind: 'multi',
  },
  (_rng, seed) => {
    const lists = [
      { items: ['telescope', 'sandwich', 'umbrella', 'trophy', 'candle', 'ladder'], theme: 'six errands-list objects' },
      { items: ['volcano', 'violin', 'compass', 'helmet', 'lantern', 'anchor'], theme: 'six story objects' },
      { items: ['cactus', 'whistle', 'blanket', 'magnet', 'bucket', 'kite'], theme: 'six camp objects' },
    ]
    const l = lists[seed % lists.length]
    const displayOrder = [...l.items].sort()
    const correctPerm = l.items.map((it) => displayOrder.indexOf(it))
    return {
      title: 'Method of loci',
      prompt:
        'The method of loci stores items along a route you know well. You will place six objects along YOUR route (front door → kitchen → your room …), then reproduce the list in order.',
      parts: [
        {
          study: `Place these ${l.theme} along your route, one vivid image per location, IN THIS ORDER:\n\n**${l.items.join(' → ')}**\n\nMake each image interact with its location (the ${l.items[0]} blocking your front door…). Take your time — walk the route once forward.`,
          studySeconds: 60,
          prompt: 'Now walk your route and rebuild the list in the original order.',
          answer: { type: 'order', options: displayOrder, correct: correctPerm },
          explanation: `Original order: ${l.items.join(' → ')}. If any location came up empty, the image was not interactive enough — bizarre, moving, colliding images stick; static ones fade.`,
        },
      ],
      hints: [
        'One item per location, always in route order.',
        'Make images COLLIDE with the location: size, motion, absurdity.',
        'Walk the route in your head — the locations do the remembering.',
      ],
      explanation:
        'The method of loci works because spatial memory is far stronger than list memory — you re-walk a familiar route and the images replay. Evidence note: mnemonics like this reliably improve list/order recall (a real, useful skill); they do not raise general intelligence, and the app will retest this list after a delay to check what actually stuck.',
    }
  },
)

// ---------- Conversation Mirror ----------

const conversationMirror = tpl(
  { id: 'o-mirror', name: 'Conversation Mirror', skillIds: ['o-listen'], bucket: 'observer', difficulty: 2, variants: 4, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        said: '"I\'m not saying the project is bad — I just think we picked the topic too fast, and now half the work doesn\'t fit together."',
        correct: 'You think we rushed the topic choice, and the mismatch is showing in the work',
        wrong: [
          'You think the project is bad and want to restart',
          'You think we should work faster to fix the pieces',
          'You think half the team is not contributing',
        ],
        note: 'The speaker explicitly EXCLUDED "the project is bad"; the paraphrase must keep both the cause (fast choice) and the symptom (pieces not fitting).',
      },
      {
        said: '"Practice was fine, I guess. Coach had me on defense again, which is fair since Riley was out — but it\'s been three weeks of that."',
        correct: 'You accept the reason for playing defense but the duration is wearing on you',
        wrong: [
          'You hate playing defense and blame Riley',
          'You think the coach is unfair to you',
          'You want to quit the team soon',
        ],
        note: 'Good paraphrase keeps the ambivalence: "fair, BUT three weeks" — flattening it to hate or blame adds content the speaker never said.',
      },
      {
        said: '"Mom said maybe for the concert. She wants to see my grades Thursday first, and honestly the ticket price is doing a lot of the deciding."',
        correct: 'It is undecided: grades Thursday and the ticket cost are the two real factors',
        wrong: [
          'Your mom said yes if you clean your room',
          'Your mom said no because of your grades',
          'You have decided not to go because it costs too much',
        ],
        note: '"Maybe" + two named conditions. A paraphrase that resolves the maybe in either direction has stopped listening and started predicting.',
      },
      {
        said: '"I know the essay is due Friday. I have the outline and the sources — writing the middle part is where I keep stalling."',
        correct: 'You are on track except the body section, which is the specific sticking point',
        wrong: [
          'You have not started the essay yet',
          'You need more sources before you can write',
          'You want the deadline moved past Friday',
        ],
        note: 'The speaker located the block precisely (the middle). Accurate mirroring preserves that precision — it is what makes the mirror useful.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Choose the accurate mirror',
      prompt: `Someone tells you:\n\n> ${c.said}\n\nWhich paraphrase would show you actually heard them?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A paraphrase may compress but never add, resolve, or judge.',
        'Check each option for smuggled content: a cause, a verdict, or an emotion the speaker never stated.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} Test for any paraphrase: could the speaker say "yes, exactly" without correcting you?`,
    }
  },
)

// ---------- Cold-Reading Defense ----------

const coldReading = tpl(
  { id: 'o-cold-reading', name: 'Cold-Reading Defense', skillIds: ['o-bias'], bucket: 'observer', difficulty: 3, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        line: '"You have a strong need for others to like you, yet you tend to be critical of yourself."',
        correct: 'A Barnum statement — vague enough that nearly everyone feels described',
        wrong: [
          'Evidence the speaker has studied you closely',
          'A statement only true of insecure people',
          'A lucky but meaningful guess',
        ],
        note: 'This is a line from Forer\'s classic 1948 demonstration: students rated this "personal" profile 4.3/5 accurate — and every student received the identical text.',
      },
      {
        line: '"I\'m sensing… someone here has recently lost something — or someone — important to them."',
        correct: 'A high-probability shotgun statement that will hit someone in any group',
        wrong: [
          'Proof of genuine sensitivity',
          'A statement that would rarely be true',
          'A detail that could not be guessed',
        ],
        note: 'In any room, loss (keys, pets, relatives, friendships) is near-universal. The audience then supplies the specifics and remembers the "hit".',
      },
      {
        line: '"You\'re usually organized, but lately things have been slipping a little, haven\'t they?"',
        correct: 'A rainbow ruse — it asserts a trait AND its opposite, so any answer confirms it',
        wrong: [
          'A precise observation of your recent behavior',
          'A claim that could easily be falsified',
          'Something only a close friend could know',
        ],
        note: 'Organized-but-slipping covers everyone. Agreeing either way feels like being "read".',
      },
      {
        line: 'After you mention exams, the reader says: "Yes — I was just about to say school pressure is central right now."',
        correct: 'Feedback fishing — they repeat back what you just revealed, as if they knew it',
        wrong: [
          'Independent confirmation of their insight',
          'Evidence they prepared research about you',
          'A coincidence too specific to be chance',
        ],
        note: 'Cold readers extract information through casual conversation and mirror it back. The defense is tracking WHO introduced each fact.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Name the technique',
      prompt: `A "psychic reader" says:\n\n> ${c.line}\n\nWhat is actually happening?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask: what fraction of ALL people would accept this statement as accurate?',
        'Track who introduced each specific fact into the conversation.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} This lab teaches DEFENSE: recognizing the machinery of fake mind-reading. The same skepticism applies to horoscopes, personality quizzes, and "I can tell you're the type who…" sales talk. (And no — microexpressions and body-language "tells" do not reliably reveal lying either; meta-analyses put human lie detection near 54%, barely above coin-flipping.)`,
    }
  },
)

// ---------- Detail Relevance ----------

const detailRelevance = tpl(
  { id: 'o-detail-relevance', name: 'Detail Relevance', skillIds: ['o-obsinf', 'o-recall'], bucket: 'observer', difficulty: 3, variants: 3, minutes: 3, transfer: true },
  (_rng, seed) => {
    const cases = [
      {
        q: 'QUESTION TO ANSWER: Did the package get delivered to the right address?',
        scene:
          'Details from the porch: (A) a delivery photo showing a door with the number 42, (B) the doormat says "welcome", (C) your address is 42 Elm Street, (D) the photo\'s door is blue and yours is red, (E) it was cloudy in the photo.',
        options: ['A: photo shows number 42', 'B: doormat says welcome', 'C: your address is 42 Elm', 'D: photo door is blue, yours is red', 'E: cloudy weather in photo'],
        correct: [0, 2, 3],
        note: 'The number matches (A, C) but the door color mismatch (D) is decisive — same number, different street. The doormat and weather decide nothing.',
      },
      {
        q: 'QUESTION TO ANSWER: Was the plant over- or under-watered?',
        scene:
          'Details: (A) leaves are yellow and drooping, (B) the soil is soggy two days after watering, (C) the pot has no drainage holes, (D) the pot is a nice shade of teal, (E) the plant sits near a window.',
        options: ['A: yellow drooping leaves', 'B: soil soggy after two days', 'C: no drainage holes', 'D: teal pot color', 'E: sits near a window'],
        correct: [0, 1, 2],
        note: 'Yellow+drooping is a symptom either way; persistent soggy soil plus no drainage points to OVER-watering. Pot color is noise; the window matters for light, not the watering question.',
      },
      {
        q: 'QUESTION TO ANSWER: Which bus did Alex take home?',
        scene:
          'Details: (A) Alex left school at 3:20, (B) route 12 stops at school at 3:25 and route 7 at 3:50, (C) Alex was home by 4:00, (D) route 7 has newer seats, (E) route 12 takes 25 minutes to Alex\'s stop.',
        options: ['A: left school 3:20', 'B: route 12 at 3:25, route 7 at 3:50', 'C: home by 4:00', 'D: route 7 has newer seats', 'E: route 12 takes 25 min'],
        correct: [0, 1, 2, 4],
        note: 'Timeline details combine: 3:25 pickup + 25 min ≈ 3:50 arrival, consistent with home-by-4:00; route 7\'s 3:50 pickup cannot beat 4:00. Seat quality decides nothing.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Which details matter?',
      prompt: `${c.q}\n\n${c.scene}\n\nSelect **every** detail that bears on the question.`,
      answer: { type: 'multi', options: c.options, correct: c.correct },
      hints: [
        'For each detail ask: would the answer change if this detail were different?',
        'Vivid ≠ relevant. Boring timeline facts usually outweigh colorful ones.',
        `Worked path: the load-bearing details are ${c.correct.map((i) => c.options[i].split(':')[0]).join(', ')}.`,
      ],
      explanation: `**${c.note}** The test for relevance is counterfactual: flip the detail and see whether the conclusion moves. Attention is a budget — spend it on details that can change the answer.`,
    }
  },
)

// ---------- High-information questions ----------

const bestQuestion = tpl(
  { id: 'o-best-question', name: 'Ask the sharper question', skillIds: ['o-listen', 'o-bias'], bucket: 'observer', difficulty: 3, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Your friend says their new study method "works great".',
        correct: '"What were your quiz scores before and after you switched?"',
        wrong: [
          '"Do you feel smarter when you use it?"',
          '"It\'s great, right? Everyone says so."',
          '"Will you keep using it?"',
        ],
        note: 'Before/after scores could actually DISCONFIRM the claim; feelings and intentions confirm anything.',
      },
      {
        setup: 'A classmate claims their phone battery "always dies by lunch".',
        correct: '"What percentage does it show when you leave home, and at what time does it die?"',
        wrong: [
          '"That\'s annoying, isn\'t it?"',
          '"Have you considered that phones are just bad now?"',
          '"Does it feel like it dies fast?"',
        ],
        note: 'Numbers and times make the claim checkable — and often shrink "always" to "twice last week".',
      },
      {
        setup: 'Someone insists the corner shop is "way more expensive" than the supermarket.',
        correct: '"Which three items did you compare, and what was each price?"',
        wrong: [
          '"Everything is expensive these days, no?"',
          '"Why do you even shop there?"',
          '"Doesn\'t it seem like prices doubled?"',
        ],
        note: 'A concrete item-by-item comparison replaces an impression with evidence — and reveals cherry-picking if only one item was pricey.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Highest-information question',
      prompt: `${c.setup}\n\nWhich question would teach you the most?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'The best question has answers that could go EITHER way — and would change your belief.',
        'Prefer questions that summon numbers, times, or specifics over questions that summon agreement.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} A question is measured by its information: if every answer leaves you believing the same thing, it was social noise, not inquiry.`,
    }
  },
)

export const OBSERVER_TEMPLATES: ItemTemplate[] = [
  evidenceLedger,
  sceneRecall,
  changeLab,
  contradictionHunt,
  threeExplanations,
  memoryPalace,
  conversationMirror,
  coldReading,
  detailRelevance,
  bestQuestion,
]
