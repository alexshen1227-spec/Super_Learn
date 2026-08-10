/**
 * Difficulty-depth bank for the four Paths.
 * Adds a new auto-graded family at 1★, 4★, and 5★ in every Path so
 * each arc has a genuine Foundation -> Expert progression.
 */
import type { AnswerSpec, ItemTemplate } from '../../domain/types'
import { pick, rint, shuffle, type Rng } from '../../engine/rng'
import { fraction, mcq, numeric, tpl } from '../lib'

function orderAnswer(rng: Rng, correctOrder: string[]): Extract<AnswerSpec, { type: 'order' }> {
  const options = shuffle(rng, correctOrder)
  return { type: 'order', options, correct: correctOrder.map((item) => options.indexOf(item)) }
}

// ---------------------------------------------------------------- Observer

const literalCases = [
  ['The blue folder is under the clock; the red folder is beside the printer.', 'Where is the blue folder?', 'Under the clock', ['Beside the printer', 'Inside the printer', 'On the clock']],
  ['Nia arrived at 3:20 carrying two books and a green bottle.', 'What color was the bottle?', 'Green', ['Blue', 'Red', 'The color was not stated']],
  ['The sign says "East entrance closed until Monday."', 'Which entrance is closed?', 'East', ['West', 'Both entrances', 'The entrance was not stated']],
  ['A small triangle appears between the square and the circle.', 'Which shape is in the middle?', 'Triangle', ['Square', 'Circle', 'Rectangle']],
  ['The first bell rang once; the second bell rang three times.', 'How many times did the second bell ring?', 'Three', ['Once', 'Twice', 'Four times']],
  ['Omar placed the ticket in the left drawer and the key in the right drawer.', 'What went in the right drawer?', 'The key', ['The ticket', 'Both objects', 'Nothing']],
  ['The north window is open. The south window is closed.', 'Which window is open?', 'North', ['South', 'Both', 'Neither']],
  ['The note is dated April 9 and signed with the initials R.K.', 'Which initials appear?', 'R.K.', ['K.R.', 'A.K.', 'No initials']],
] as const

const observerLiteral = tpl(
  { id: 'depth-o-literal-detail', name: 'Literal Detail', skillIds: ['o-recall', 'o-listen'], bucket: 'observer', difficulty: 1, variants: 8, minutes: 1.5 },
  (rng, seed) => {
    const [record, question, correct, wrong] = literalCases[seed % literalCases.length]
    return {
      title: 'Read exactly what is there',
      prompt: `Record: **${record}**\n\n${question}`,
      answer: mcq(rng, correct, [...wrong]),
      hints: ['Return to the exact noun named in the question.', 'Do not swap a nearby detail into the requested slot.', `The record says: ${correct}.`],
      explanation: `**${correct}** is stated directly. This Foundation drill isolates exact encoding before harder Observer work adds inference, conflict, and uncertainty.`,
    }
  },
)

const corroborationCases = [
  {
    record: 'Camera: a cyclist entered at 4:12. Door log: entry at 4:12. Pat: "It was just after four." Lee: "It was before four."',
    correct: 'The cyclist entered at about 4:12.',
    wrong: ['Lee has the most precise account.', 'The cyclist entered before four.', 'The door log proves who the cyclist was.'],
  },
  {
    record: 'Receipt: 3 notebooks. Inventory change: -3 notebooks. Sam: "I bought some school supplies." Jo: "Sam bought four notebooks."',
    correct: 'Three notebooks left inventory in the purchase.',
    wrong: ['Four notebooks were purchased.', 'Sam bought only notebooks.', 'The receipt proves Jo watched the purchase.'],
  },
  {
    record: 'Weather station: 18 mm rain. Gauge photo: mark near 18 mm. Ari: "It poured." Bea: "There was barely any rain."',
    correct: 'The measured rainfall was about 18 mm.',
    wrong: ['Bea is lying.', '18 mm always causes flooding.', 'The storm lasted exactly 18 minutes.'],
  },
  {
    record: 'File history: edit at 7:41 by account M. Screen capture: paragraph changed at 7:41. M: "I fixed the introduction."',
    correct: 'Account M changed the document around 7:41.',
    wrong: ['M wrote the entire document.', 'The change improved the introduction.', 'Nobody else opened the file.'],
  },
  {
    record: 'Score sheet: 14-12. Photo of board: 14-12. Coach: "We led by two." Spectator: "We led by three."',
    correct: 'The recorded lead was two points.',
    wrong: ['The spectator counted more carefully.', 'The team eventually won.', 'The coach set the score.'],
  },
  {
    record: 'Scale: 2.4 kg. Shipping label: 2.4 kg. Clerk: "A little over two kilos." Customer: "It felt like four."',
    correct: 'The recorded mass was 2.4 kg.',
    wrong: ['The customer carried 4 kg.', 'The scale was calibrated that morning.', 'The package contained metal.'],
  },
  {
    record: 'Calendar: meeting moved to Room 6. Email: "New room: 6." Kim: "I think it is still Room 4."',
    correct: 'The updated meeting location is Room 6.',
    wrong: ['Kim received no email.', 'Room 4 is unavailable.', 'The meeting time also changed.'],
  },
  {
    record: 'Timer: 9:58. Finish photo: timer at 9:58. Runner: "Just under ten minutes." Announcer: "About eleven."',
    correct: 'The recorded finish time was 9:58.',
    wrong: ['The announcer used a different timer.', 'The runner won the race.', 'The course was shorter than usual.'],
  },
]

const observerCorroboration = tpl(
  { id: 'depth-o-corroboration', name: 'Corroboration Audit', skillIds: ['o-obsinf', 'o-bias'], bucket: 'observer', difficulty: 4, variants: 8, minutes: 3.5, calibration: true, transfer: true },
  (rng, seed) => {
    const c = corroborationCases[seed % corroborationCases.length]
    return {
      title: 'Reconcile independent records',
      prompt: `${c.record}\n\nWhich conclusion is supported without stretching beyond the sources?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: ['Prefer independent records that converge on the same narrow fact.', 'Agreement about one detail does not prove identity, cause, quality, or intention.', `Supported conclusion: ${c.correct}`],
      explanation: `**${c.correct}** Two independent records converge on that claim. The other options either privilege a contradicted memory or smuggle in a conclusion the records cannot establish.`,
    }
  },
)

const observerDossier = tpl(
  { id: 'depth-o-dossier', name: 'Observer Dossier', skillIds: ['o-recall', 'o-obsinf', 'o-memory', 'o-bias'], bucket: 'observer', difficulty: 5, variants: 8, minutes: 5, kind: 'multi', calibration: true },
  (rng) => {
    const locations = shuffle(rng, ['Atrium', 'Library', 'Workshop', 'Garden', 'Studio'])
    const objects = shuffle(rng, ['brass key', 'violet card', 'glass token', 'red cord', 'silver badge'])
    const baseMinute = rint(rng, 10, 25)
    const records = locations.map((location, index) => ({ location, object: objects[index], time: `3:${String(baseMinute + index * 4).padStart(2, '0')}` }))
    const queried = records[rint(rng, 0, records.length - 1)]
    const falseObject = objects.find((object) => object !== queried.object)!
    return {
      title: 'Audit a compact dossier',
      prompt: 'Study the five timestamped records. Then reconstruct sequence, retrieve an exact binding, and audit a witness claim.',
      parts: [
        {
          study: records.map((record) => `${record.time} | ${record.location} | ${record.object}`).join('\n'),
          studySeconds: 55,
          prompt: 'Put the locations in chronological order.',
          answer: orderAnswer(rng, locations),
          explanation: `The timestamp order is **${locations.join(' -> ')}**.`,
        },
        {
          prompt: `Which object was recorded at the ${queried.location}?`,
          answer: mcq(rng, queried.object, objects.filter((object) => object !== queried.object)),
          explanation: `The ${queried.location} record binds that place to the **${queried.object}**.`,
        },
        {
          prompt: `A witness says: "The ${falseObject} was at the ${queried.location}." How should that claim be labeled?`,
          answer: mcq(rng, 'Contradicted by the record', ['Supported by the record', 'Unknown from the record', 'Supported only because the witness sounds certain']),
          explanation: `The dossier records the **${queried.object}**, not the ${falseObject}, at ${queried.location}; the witness claim is contradicted.`,
        },
      ],
      hints: ['Encode each row as time -> place -> object, not as three separate lists.', 'Rebuild the chronological route first; use it to retrieve each object binding.', `The queried binding is ${queried.location} -> ${queried.object}.`],
      explanation: 'Expert observation combines structured encoding, exact retrieval, and source conflict without allowing confidence to replace the record.',
    }
  },
)

// ------------------------------------------------------------- Investigator

const conditionalCases = [
  ['If a card is blue, it has a star. This card is blue.', 'The card has a star.', ['The card might not have a star.', 'Every starred card is blue.', 'The card is round.']],
  ['If the alarm is armed, the green light is on. The green light is off.', 'The alarm is not armed.', ['The alarm is armed.', 'Every green light is an alarm.', 'The alarm has no battery.']],
  ['All robins are birds. Pip is a robin.', 'Pip is a bird.', ['Pip is not a bird.', 'Every bird is a robin.', 'Pip can definitely fly.']],
  ['No metal tokens float. This token floats.', 'This token is not metal.', ['This token is metal.', 'All nonmetal tokens float.', 'The token is hollow.']],
  ['If the code runs, a result appears. The code runs.', 'A result appears.', ['No result appears.', 'Every result comes from this code.', 'The result is correct.']],
  ['Every square has four sides. Shape Q is a square.', 'Q has four sides.', ['Q has three sides.', 'Every four-sided shape is a square.', 'Q is large.']],
  ['If the gate is locked, the indicator is red. The indicator is not red.', 'The gate is not locked.', ['The gate is locked.', 'A red indicator is impossible.', 'The gate is open.']],
  ['No reptiles have fur. This animal has fur.', 'This animal is not a reptile.', ['This animal is a reptile.', 'All furry animals are mammals.', 'The animal is warm.']],
] as const

const investigatorConditional = tpl(
  { id: 'depth-i-conditional', name: 'Rule Chain Basics', skillIds: ['i-logic'], bucket: 'investigator', difficulty: 1, variants: 8, minutes: 1.5 },
  (rng, seed) => {
    const [facts, correct, wrong] = conditionalCases[seed % conditionalCases.length]
    return {
      title: 'Follow one rule exactly',
      prompt: `${facts}\n\nWhat must follow?`,
      answer: mcq(rng, correct, [...wrong]),
      hints: ['Identify the rule and check whether the stated fact activates it.', 'Do not reverse the rule or add a new property.', `Required conclusion: ${correct}`],
      explanation: `**${correct}** follows directly. Foundation logic is strict: carry only what the rule licenses, no more and no less.`,
    }
  },
)

const investigatorTwoStage = tpl(
  { id: 'depth-i-two-stage-update', name: 'Two-Stage Evidence Update', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 4, variants: 8, minutes: 4, calibration: true },
  (rng) => {
    const population = 10_000
    const prevalence = pick(rng, [5, 10])
    const trueCount = (population * prevalence) / 100
    const falseCount = population - trueCount
    const firstTrueRate = pick(rng, [80, 90])
    const firstFalseRate = pick(rng, [10, 20])
    const secondTrueRate = pick(rng, [50, 100])
    const secondFalseRate = pick(rng, [10, 20, 50])
    const trueBoth = trueCount * (firstTrueRate / 100) * (secondTrueRate / 100)
    const falseBoth = falseCount * (firstFalseRate / 100) * (secondFalseRate / 100)
    return {
      title: 'Update through two screens',
      prompt: `In ${population.toLocaleString()} cases, ${prevalence}% truly have a condition.\n\nScreen A flags ${firstTrueRate}% of true cases and ${firstFalseRate}% of other cases. Among each group flagged by A, independent Screen B flags ${secondTrueRate}% of true cases and ${secondFalseRate}% of other cases.\n\nAmong cases flagged by **both**, what fraction truly have the condition?`,
      answer: fraction(trueBoth, trueBoth + falseBoth),
      hints: [`Start with ${trueCount} true and ${falseCount} other cases.`, `Both screens flag ${trueBoth} true cases and ${falseBoth} other cases.`, `Use ${trueBoth} / ${trueBoth + falseBoth}, then simplify.`],
      explanation: `Both screens retain **${trueBoth} true cases** and **${falseBoth} false cases**. The keyed fraction is ${trueBoth}/${trueBoth + falseBoth}, simplified. Two updates require carrying both branches through both screens.`,
    }
  },
)

const investigatorSynthesis = tpl(
  { id: 'depth-i-hypothesis-synthesis', name: 'Weighted Hypothesis Synthesis', skillIds: ['i-bayes', 'i-hypo', 'i-logic'], bucket: 'investigator', difficulty: 5, variants: 8, minutes: 5, transfer: true, calibration: true },
  (rng) => {
    let rows: { name: string; prior: number; e1: number; e2: number; score: number }[] = []
    for (let attempt = 0; attempt < 30; attempt++) {
      const priors = shuffle(rng, [0.5, 0.3, 0.2])
      rows = ['H1', 'H2', 'H3'].map((name, index) => {
        const e1 = pick(rng, [0.2, 0.4, 0.6, 0.8])
        const e2 = pick(rng, [0.25, 0.5, 0.75, 1])
        return { name, prior: priors[index], e1, e2, score: priors[index] * e1 * e2 }
      })
      const scores = rows.map((row) => row.score)
      if (scores.filter((score) => score === Math.max(...scores)).length === 1) break
    }
    const best = rows.reduce((a, b) => (b.score > a.score ? b : a))
    const rowText = rows.map((row) => `${row.name}: prior ${row.prior}; P(E1|${row.name}) ${row.e1}; P(E2|${row.name}) ${row.e2}`).join('\n')
    const option = (row: typeof best) => `${row.name} (unnormalized score ${Number(row.score.toFixed(4))})`
    return {
      title: 'Combine prior and two clues',
      prompt: `Assume E1 and E2 are conditionally independent within each hypothesis.\n\n${rowText}\n\nAfter observing both clues, which hypothesis has the greatest posterior probability?`,
      answer: mcq(rng, option(best), rows.filter((row) => row.name !== best.name).map(option)),
      hints: ['Posterior ranking is proportional to prior x likelihood of E1 x likelihood of E2.', 'Calculate an unnormalized score for every hypothesis; normalization is unnecessary just to rank them.', `Highest score: ${option(best)}.`],
      explanation: `**${option(best)}** is largest. Expert investigation lets a strong prior and diagnostic evidence trade off numerically instead of choosing whichever clue feels most vivid.`,
    }
  },
)

// ---------------------------------------------------------------- Strategist

const nextActionCases = [
  ['Goal: submit a science report. Nothing has been started.', 'Read the rubric and identify the required sections.', ['Choose the final font.', 'Submit an empty file.', 'Ask for praise on the conclusion.']],
  ['Goal: arrive by 8:00. Travel time is unknown.', 'Check realistic travel time and route options.', ['Pick an alarm sound.', 'Leave at 7:59.', 'Assume the fastest possible trip.']],
  ['Goal: improve a quiz score. The missed topics are unknown.', 'Sort the missed questions by skill and error type.', ['Repeat only the easiest correct questions.', 'Buy new stationery.', 'Study every chapter equally.']],
  ['Goal: organize a club event. The date is not confirmed.', 'Confirm the date and non-negotiable constraints.', ['Print decorations.', 'Promise a venue to everyone.', 'Assign cleanup before choosing a location.']],
  ['Goal: repair a bug. The failure cannot yet be repeated.', 'Find the smallest reliable reproduction.', ['Rewrite the entire app.', 'Change several systems at once.', 'Declare the bug random.']],
  ['Goal: save $60. Current spending is unknown.', 'Record a normal week of spending.', ['Skip one meal immediately.', 'Guess where all money goes.', 'Choose a reward for finishing.']],
  ['Goal: finish a group presentation. Roles are unclear.', 'List deliverables and assign one owner to each.', ['Wait for someone else to start.', 'Polish the title slide alone.', 'Schedule the celebration.']],
  ['Goal: test whether a routine helps focus. No baseline exists.', 'Measure focus with the current routine first.', ['Change sleep, food, and routine together.', 'Ask whether the new routine sounds scientific.', 'Keep only the best day.']],
] as const

const strategistNextAction = tpl(
  { id: 'depth-st-next-action', name: 'First Useful Step', skillIds: ['st-decomp'], bucket: 'strategist', difficulty: 1, variants: 8, minutes: 1.5 },
  (rng, seed) => {
    const [situation, correct, wrong] = nextActionCases[seed % nextActionCases.length]
    return {
      title: 'Choose the first dependency',
      prompt: `${situation}\n\nWhat is the first useful action?`,
      answer: mcq(rng, correct, [...wrong]),
      hints: ['Find the missing information that later steps depend on.', 'Do not polish, promise, or optimize before the plan has a foundation.', `First dependency: ${correct}`],
      explanation: `**${correct}** creates information or structure required by later work. Foundation strategy begins with dependencies, not motion for its own sake.`,
    }
  },
)

const strategistCriticalPath = tpl(
  { id: 'depth-st-critical-path', name: 'Critical Path Calculation', skillIds: ['st-decomp', 'st-estimate'], bucket: 'strategist', difficulty: 4, variants: 12, minutes: 4, transfer: true },
  (rng) => {
    const a = rint(rng, 2, 7)
    const b = rint(rng, 2, 7)
    const c = rint(rng, 2, 7)
    const d = rint(rng, 2, 7)
    const e = rint(rng, 1, 4)
    const total = Math.max(a + c, b + d) + e
    return {
      title: 'Find the path that controls the finish',
      prompt: `Tasks A (${a}h) and B (${b}h) can start together. C (${c}h) follows A. D (${d}h) follows B. Final task E (${e}h) starts only after both C and D finish.\n\nWith unlimited workers, what is the shortest possible completion time?`,
      answer: numeric(total, { unit: 'hours' }),
      hints: ['Calculate the two parallel branch lengths separately.', `Branch A->C is ${a + c}h; branch B->D is ${b + d}h.`, `E waits for the longer branch: max(${a + c}, ${b + d}) + ${e} = ${total}.`],
      explanation: `The minimum is **${total} hours**. The critical branch lasts ${Math.max(a + c, b + d)} hours, then E adds ${e}. Adding every task would ignore parallel work.`,
    }
  },
)

const strategistPortfolio = tpl(
  { id: 'depth-st-portfolio', name: 'Constrained Portfolio', skillIds: ['st-ev', 'st-decomp', 'st-ethics'], bucket: 'strategist', difficulty: 5, variants: 8, minutes: 5, calibration: true },
  (rng) => {
    let projects: { name: string; cost: number; value: number; risk: number }[] = []
    let budget = 10
    let riskCap = 7
    let candidates: { label: string; value: number }[] = []
    for (let attempt = 0; attempt < 40; attempt++) {
      projects = ['A', 'B', 'C', 'D'].map((name) => ({ name, cost: rint(rng, 3, 7), value: rint(rng, 6, 16), risk: rint(rng, 1, 5) }))
      budget = rint(rng, 9, 12)
      riskCap = rint(rng, 5, 8)
      candidates = []
      for (let i = 0; i < projects.length; i++) for (let j = i + 1; j < projects.length; j++) {
        const x = projects[i]
        const y = projects[j]
        if (x.cost + y.cost <= budget && x.risk + y.risk <= riskCap) candidates.push({ label: `${x.name} + ${y.name}`, value: x.value + y.value })
      }
      const bestValue = candidates.length ? Math.max(...candidates.map((candidate) => candidate.value)) : -1
      if (candidates.length >= 2 && candidates.filter((candidate) => candidate.value === bestValue).length === 1) break
    }
    const best = candidates.reduce((a, b) => (b.value > a.value ? b : a))
    const allPairs: string[] = []
    for (let i = 0; i < projects.length; i++) for (let j = i + 1; j < projects.length; j++) allPairs.push(`${projects[i].name} + ${projects[j].name}`)
    return {
      title: 'Optimize without breaking constraints',
      prompt: `Choose exactly two projects. Total cost must be <= ${budget}; total risk must be <= ${riskCap}.\n\n${projects.map((p) => `${p.name}: cost ${p.cost}, value ${p.value}, risk ${p.risk}`).join('\n')}\n\nWhich feasible pair has the greatest total value?`,
      answer: mcq(rng, `${best.label} (value ${best.value})`, allPairs.filter((pair) => pair !== best.label).map((pair) => {
        const [aName, bName] = pair.split(' + ')
        const a = projects.find((project) => project.name === aName)!
        const b = projects.find((project) => project.name === bName)!
        return `${pair} (value ${a.value + b.value})`
      })),
      hints: ['Eliminate pairs that violate either constraint before comparing value.', `Feasible pairs: ${candidates.map((candidate) => `${candidate.label}=${candidate.value}`).join(', ')}.`, `Best feasible pair: ${best.label} with value ${best.value}.`],
      explanation: `**${best.label}** is feasible and yields **${best.value} value**. Expert strategy optimizes only inside the real constraint set; an impressive but infeasible option is not a plan.`,
    }
  },
)

// ----------------------------------------------------------------- Guardian

const clearNoCases = [
  ['A friend asks for your password.', 'No. I do not share passwords.', ['Maybe, if you promise not to use it.', 'Why are you always so suspicious?', 'Ignore the message but share it later.']],
  ['Someone keeps borrowing your charger without asking.', 'Ask first. If you take it again without asking, I will keep it with me.', ['Fine, take it, just make sure you bring it back to me at some point.', 'You are honestly the most inconsiderate person on this whole team.', 'Hide something of theirs in return so that they know how it feels.']],
  ['A group wants you to join a prank you dislike.', 'I am not joining. I will meet you afterward.', ['I suppose I have to come along if everyone else is going.', 'Go along with it but complain about having to the entire time.', 'Tell the whole group there will be consequences if they keep asking.']],
  ['A classmate asks to copy your answer.', 'I will not share answers. I can explain the method.', ['Let them copy it quickly, before the teacher notices anything.', 'You are honestly too lazy to bother learning any of this yourself.', 'Say yes to keep the peace and quietly resent them for it.']],
  ['A relative posts your photo after you asked them not to.', 'Please remove it. I do not consent to my photos being posted.', ['It is probably far too late to say anything about it now.', 'Post an embarrassing photo of them so they know how it feels.', 'Write a long public post attacking them for what they did.']],
  ['A teammate messages repeatedly during your sleep hours.', 'I mute messages at night and will reply in the morning.', ['I have to answer every message, whatever time it arrives.', 'Do not ever contact me again, at any time of day.', 'Carry on losing sleep over it without mentioning it to them.']],
  ['Someone pressures you to lend an item you need.', 'I need it today, so I am not lending it.', ['Take it, I will figure something out.', 'You never respect anything.', 'Pretend it is broken.']],
  ['A friend asks you to keep an ordinary surprise-party plan quiet.', 'I can keep the party plan private until the event.', ['I have to tell everybody about this straight away.', 'Any secret at all is a warning sign and should be told.', 'Use knowing the secret to ask them for a favour later.']],
] as const

const guardianClearNo = tpl(
  { id: 'depth-h-clear-no', name: 'Clear Boundary Basics', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 1, variants: 8, minutes: 1.5 },
  (rng, seed) => {
    const [situation, correct, wrong] = clearNoCases[seed % clearNoCases.length]
    return {
      title: 'Say the limit plainly',
      prompt: `${situation}\n\nWhich response is clear and proportionate?`,
      answer: mcq(rng, correct, [...wrong]),
      hints: ['Use a direct limit without an insult or invented excuse.', 'A good boundary controls your own action and can include a safe alternative.', `Clear response: ${correct}`],
      explanation: `**${correct}** states the limit without cruelty or ambiguity. Foundation boundary work makes the sentence short enough to use under pressure.`,
    }
  },
)

const neutralRequests = [
  'Could you send your notes when you have time? It is okay if not.',
  'Would Saturday or Sunday work better? Either is fine.',
  'I disagree with the plan; can we compare the two options?',
  'Please return the book by Friday, as we agreed.',
]
const pressureRequests = [
  'Everyone else said yes, so stop making this difficult.',
  'Answer right now or I will know you do not care.',
  'After all I did for you, you owe me this.',
  'You are so smart; prove it by doing my work for me.',
]
const safetyAlarms = [
  'Do not tell a trusted adult about our messages.',
  'Send your password or I will publish your private photo.',
  'Meet me alone and disable location sharing with your family.',
  'If you leave, I will hurt you or someone you care about.',
]

const guardianTriage = tpl(
  { id: 'depth-h-message-triage', name: 'Message Triage', skillIds: ['h-influence', 'h-boundary'], bucket: 'insight', difficulty: 4, variants: 8, minutes: 4, transfer: true },
  (rng) => {
    const statements = shuffle(rng, [
      ...shuffle(rng, neutralRequests).slice(0, 2).map((text) => ({ text, category: 0 })),
      ...shuffle(rng, pressureRequests).slice(0, 2).map((text) => ({ text, category: 1 })),
      ...shuffle(rng, safetyAlarms).slice(0, 2).map((text) => ({ text, category: 2 })),
    ])
    return {
      title: 'Separate requests, pressure, and danger',
      prompt: 'Classify each message by the strongest signal it contains.',
      answer: { type: 'classify', categories: ['Respectful request', 'Pressure tactic', 'Safety alarm'], statements },
      hints: ['A respectful request leaves a real no. Pressure makes no emotionally costly. A safety alarm adds threats, isolation, secrecy, or credential demands.', 'Classify by the strongest signal, even if the sentence also sounds friendly.', 'Safety alarms require distance, preserved evidence, and trusted help rather than a better debate.'],
      explanation: 'Respectful requests preserve choice. Pressure tactics manipulate the cost of refusing. Threats, forced secrecy, isolation, and credential demands cross into safety alarms and should be escalated to trusted help.',
    }
  },
)

const safetyCases = [
  {
    situation: 'An online contact who claims to be 16 asks for private photos, demands secrecy from your parents, and threatens to disappear if you refuse.',
    correct: 'Stop replying, preserve the messages, block/report the account, and tell a trusted adult now.',
    wrong: ['Send one completely harmless photo just to calm them down, and then stop replying to anything they send afterwards.', 'Keep arguing with them until they agree to prove how old they actually are, and decide what to do from there.', 'Delete everything so that it cannot be seen by anyone, and handle the whole situation on your own without telling people.'],
  },
  {
    situation: 'Two teammates are shouting. One picks up a heavy object and blocks the doorway.',
    correct: 'Create distance, do not physically intervene, and get a responsible adult or emergency help immediately.',
    wrong: ['Stand in between the two of them and calmly try to talk through the facts until everybody has cooled down.', 'Take the object off them by force straight away, before anybody standing nearby can end up getting hurt by it.', 'Keep filming the whole thing from nearby so that there is clear evidence of what happened available afterwards.'],
  },
  {
    situation: 'A friend says they may hurt themselves tonight and asks you to promise not to tell anyone.',
    correct: 'Stay connected if safe, tell a trusted adult or emergency service immediately, and do not keep the secrecy promise.',
    wrong: ['Promise to keep the whole thing completely secret, so that they carry on trusting you enough to keep talking to you.', 'Wait until tomorrow and see whether they actually meant any of what they said before doing anything about it.', 'Try to become the one person they rely on for everything, so that you can keep a close eye on how they are doing.'],
  },
  {
    situation: 'A stranger sends a link claiming your account will vanish in five minutes unless you enter your password.',
    correct: 'Do not open the link; use the official app directly, report the message, and ask trusted help if credentials were entered.',
    wrong: ['Enter the password quickly so the account is not locked out, and then change it again later on to be safe.', 'Reply to the message and ask them directly whether the link is a real one before deciding whether to open it.', 'Forward the link on to a few friends first, so that somebody else can open it and find out whether it is genuine.'],
  },
  {
    situation: 'A classmate repeatedly threatens to share an edited humiliating image unless you do their assignments.',
    correct: 'Save the threats, stop negotiating, block/report where possible, and involve a trusted adult or school authority.',
    wrong: ['Do just one of the assignments for them to buy yourself a bit more time to work out what to do next.', 'Threaten them with something worse than what they sent, so that they realise you are not going to be an easy target.', 'Delete all of the messages straight away so that nobody else ever sees them, and carry on as though nothing happened.'],
  },
  {
    situation: 'At a gathering, your ride becomes impaired and insists they can still drive you home.',
    correct: 'Do not get in the vehicle; contact a safe sober adult or alternate ride and involve emergency help if they try to drive.',
    wrong: ['Sit in the front passenger seat and keep talking to them the whole way, so that they stay alert enough to drive.', 'Accept the lift anyway, because refusing it at this point would probably offend them and cause a scene.', 'Take the keys off them by force, starting a physical fight over it if that turns out to be what it takes.'],
  },
  {
    situation: 'Someone follows you after you clearly leave a conversation and keeps asking where you live.',
    correct: 'Move toward a staffed public place, contact a trusted person or emergency help, and do not go home alone while followed.',
    wrong: ['Lead them back towards your house so that somebody who is already there can get a proper look at them.', 'Stop somewhere quiet and out of the way in order to turn round and confront them about it directly.', 'Give them a fake address in order to throw them off, and then carry on walking the rest of the way home alone.'],
  },
  {
    situation: 'A trusted friend disagrees with your plan, speaks calmly, and accepts your final decision.',
    correct: 'Treat it as respectful disagreement; discuss evidence if useful and keep your own decision.',
    wrong: ['Treat any disagreement at all as a sign that you are being manipulated.', 'End the friendship immediately rather than have the conversation at all.', 'Agree with them simply to make the uncomfortable feeling go away faster.'],
  },
]

const guardianSafety = tpl(
  { id: 'depth-h-safety-synthesis', name: 'Safety Synthesis', skillIds: ['h-boundary', 'h-influence', 'h-emotion'], bucket: 'insight', difficulty: 5, variants: 8, minutes: 4.5, calibration: true },
  (rng, seed) => {
    const c = safetyCases[seed % safetyCases.length]
    return {
      title: 'Choose the response at the right safety level',
      prompt: `${c.situation}\n\nWhat is the strongest proportionate response?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: ['First classify the situation: disagreement, pressure, threat, or immediate danger.', 'When threats, self-harm, stalking, impaired driving, or forced secrecy appear, safety outranks social smoothness.', `Best response: ${c.correct}`],
      explanation: `**${c.correct}** Expert Guardian judgment matches the response to the safety level: respectful disagreement stays a conversation; coercion and danger require distance, evidence, trusted help, or emergency support.`,
    }
  },
)

export const PATH_DEPTH_TEMPLATES: ItemTemplate[] = [
  observerLiteral,
  observerCorroboration,
  observerDossier,
  investigatorConditional,
  investigatorTwoStage,
  investigatorSynthesis,
  strategistNextAction,
  strategistCriticalPath,
  strategistPortfolio,
  guardianClearNo,
  guardianTriage,
  guardianSafety,
]
