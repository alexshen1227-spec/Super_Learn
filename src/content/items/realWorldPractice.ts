/**
 * Short real-world transfer practice. Unlike the longer Work Studios, these
 * are 2–5 minute decisions built from receipts, schedules, messages, service
 * terms, bug reports, household measurements, and public claims. Every answer
 * is authored or computed and passes through the normal content audit.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, money, round, tpl } from '../lib'
import { pick, rint } from '../../engine/rng'

const receipt = tpl(
  { id: 'real-receipt-check', name: 'Real Life: Check the Receipt', skillIds: ['m-percent'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2.5, transfer: true },
  (rng) => {
    const subtotal = rint(rng, 8, 32)
    const rate = pick(rng, [10, 15, 20] as const)
    const tip = round((subtotal * rate) / 100, 2)
    return {
      title: 'Receipt check',
      prompt: `A café subtotal is **$${subtotal}**. You intend to leave a **${rate}%** tip. What tip amount should appear on the receipt?`,
      answer: { type: 'numeric', answer: tip, tolerance: 0.005, unit: 'dollars' },
      hints: [`${rate}% = ${rate / 100}.`, 'Multiply the subtotal by the decimal rate.'],
      explanation: `$${subtotal} × ${rate / 100} = **${money(tip)}**. Check the decimal place: a ${rate}% tip should be much smaller than the bill, not ${rate} times it.`,
      transferBridge: 'Estimate first (10% is one decimal-place shift), then calculate. The estimate catches a mistyped decimal.',
    }
  },
)

const unitPrice = tpl(
  { id: 'real-unit-price', name: 'Real Life: Compare Unit Prices', skillIds: ['m-ratio'], bucket: 'math', difficulty: 2, variants: 24, minutes: 2.5, transfer: true },
  (rng) => {
    const sizeA = rint(rng, 3, 5) * 4
    const sizeB = sizeA + 4
    const centsA = rint(rng, 18, 28)
    const centsB = centsA + pick(rng, [-3, -2, 2, 3] as const)
    const priceA = round((sizeA * centsA) / 100, 2)
    const priceB = round((sizeB * centsB) / 100, 2)
    const winner = centsA < centsB ? `Pack A at ${centsA}¢ per unit` : `Pack B at ${centsB}¢ per unit`
    return {
      title: 'Shelf-label decision',
      prompt: `Pack A: **${sizeA} units for ${money(priceA)}**. Pack B: **${sizeB} units for ${money(priceB)}**. Which is cheaper per unit?`,
      answer: mcq(rng, winner, [
        centsA < centsB ? `Pack B because ${sizeB} is larger` : `Pack A because ${money(priceA)} is the lower sticker price`,
        'They are equal because both are the same product',
        'The larger pack is always the better value',
      ]),
      hints: ['Sticker price and unit price answer different questions.', 'Divide each price by its number of units.'],
      explanation: `A costs **${centsA}¢/unit**; B costs **${centsB}¢/unit**. The better unit price matters only if you will use the quantity before it expires and can afford the total today.`,
      transferBridge: 'Unit price is one constraint, not the whole decision—waste, storage, and cash today can reverse the practical choice.',
    }
  },
)

const commute = tpl(
  { id: 'real-commute-time', name: 'Real Life: Travel-Time Check', skillIds: ['p-motion'], bucket: 'physics', difficulty: 2, variants: 20, minutes: 2.5, transfer: true },
  (rng) => {
    const distance = rint(rng, 3, 12)
    const speed = pick(rng, [3, 4, 6] as const)
    const minutes = (distance / speed) * 60
    return {
      title: 'Can the travel claim be true?',
      prompt: `A route is **${distance} km**. At an average moving speed of **${speed} km/h**, how many minutes does the travel itself take?`,
      answer: { type: 'numeric', answer: minutes, tolerance: 0.01, unit: 'minutes' },
      hints: ['Time = distance ÷ speed.', 'The result is in hours; multiply by 60.'],
      explanation: `${distance} ÷ ${speed} = ${distance / speed} hours = **${minutes} minutes**. This excludes waiting, parking, and delays—real arrival plans need a buffer beyond the physics minimum.`,
      transferBridge: 'Separate moving time from door-to-door time. Hidden transitions are where real schedules usually fail.',
    }
  },
)

const energyLabel = tpl(
  { id: 'real-energy-label', name: 'Real Life: Appliance Energy', skillIds: ['p-energy'], bucket: 'physics', difficulty: 3, variants: 20, minutes: 3, transfer: true },
  (rng) => {
    const watts = pick(rng, [40, 60, 80, 100] as const)
    const hours = rint(rng, 2, 6)
    const days = rint(rng, 20, 30)
    const kwh = round((watts * hours * days) / 1000, 2)
    return {
      title: 'Read the energy label',
      prompt: `A **${watts} W** device runs **${hours} hours/day** for **${days} days**. How many kilowatt-hours does it use?`,
      answer: { type: 'numeric', answer: kwh, tolerance: 0.01, unit: 'kWh' },
      hints: ['Energy = power × time.', 'W × hours gives Wh; divide by 1000 for kWh.'],
      explanation: `${watts} × ${hours} × ${days} = ${watts * hours * days} Wh = **${kwh} kWh**. This is an energy estimate; cost requires the utility’s price per kWh.`,
      transferBridge: 'Use label power as an estimate, then compare with a plug-in meter if standby power or cycling matters.',
    }
  },
)

const bugReport = tpl(
  { id: 'real-bug-report', name: 'Real Life: Write a Reproducible Bug Report', skillIds: ['c-trace'], bucket: 'coding', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const feature = pick(rng, ['Save button', 'search filter', 'dark-mode toggle', 'assignment sorter'] as const)
    return {
      title: 'Bug triage',
      prompt: `Someone reports: “The **${feature}** is broken sometimes.” Which follow-up creates the most useful bug report?`,
      answer: mcq(rng, 'Record exact starting state, numbered actions, expected result, actual result, and whether the sequence reproduces twice', [
        'Ask them to describe how annoying it feels',
        'Rewrite the feature immediately without reproducing it',
        'Close the report because “sometimes” is vague',
      ]),
      hints: ['A developer needs to make the failure happen on demand.', 'Separate expected behavior from observed behavior.'],
      explanation: 'Reproduction steps turn a complaint into a test. Starting state matters because many intermittent bugs depend on hidden state left by an earlier action.',
      transferBridge: 'This structure also improves reports about broken devices, confusing instructions, and process failures.',
    }
  },
)

const notificationLoop = tpl(
  { id: 'real-notification-loop', name: 'Real Life: Trace an Automation', skillIds: ['c-loops', 'c-bool'], bucket: 'coding', difficulty: 3, variants: 20, minutes: 3, transfer: true },
  (rng) => {
    const days = Array.from({ length: 6 }, () => rint(rng, 0, 3))
    const threshold = pick(rng, [1, 2] as const)
    const count = days.filter((x) => x >= threshold).length
    return {
      title: 'Notification rule',
      prompt: `An automation loops over overdue-task counts **[${days.join(', ')}]** and sends one reminder for each day with count **≥ ${threshold}**. How many reminders are sent?`,
      answer: { type: 'numeric', answer: count },
      hints: [`Test each value against ≥ ${threshold}.`, 'Count matches; do not add the overdue tasks themselves.'],
      explanation: `${days.map((x) => `${x}${x >= threshold ? '✓' : '×'}`).join(', ')} gives **${count} reminders**. Tracing real automations requires separating loop iterations from the quantities stored inside them.`,
      transferBridge: 'Before enabling an automation, trace a small sample. It catches notification floods and missing boundary cases cheaply.',
    }
  },
)

const headlineClaim = tpl(
  { id: 'real-headline-claim', name: 'Real Life: Audit a Headline', skillIds: ['s-sources', 's-corr'], bucket: 'science', difficulty: 3, variants: 16, minutes: 3.5, transfer: true, calibration: true },
  (rng) => {
    const group = pick(rng, ['students who sleep more', 'people who walk to work', 'teens who eat breakfast', 'players who practice daily'] as const)
    const outcome = pick(rng, ['report higher grades', 'report lower stress', 'miss fewer days', 'win more matches'] as const)
    return {
      title: 'Headline versus study',
      prompt: `Headline: “New study proves the habit causes success.” Study detail: a one-time survey finds **${group} ${outcome}**. Which rewrite matches the design?`,
      answer: mcq(rng, `Survey finds an association: ${group} ${outcome}; causal direction remains unknown`, [
        'The habit has been proven to cause success',
        'The survey proves success causes the habit',
        'The data means nothing because it is observational',
      ]),
      hints: ['A one-time survey observes; it does not assign the habit.', 'Name association and the missing causal direction.'],
      explanation: 'The relationship may be real while its cause remains unresolved. Confounds and reverse causation are live until design—not confident wording—rules them out.',
      transferBridge: 'Read past the headline for assignment, timing, comparison group, sample, and measured outcome.',
    }
  },
)

const householdExperiment = tpl(
  { id: 'real-household-experiment', name: 'Real Life: Improve a Household Test', skillIds: ['s-design'], bucket: 'science', difficulty: 4, variants: 12, minutes: 4, transfer: true },
  (rng) => {
    const claim = pick(rng, ['one towel brand absorbs more', 'one battery lasts longer', 'one insulation material slows cooling', 'one soil mix retains more water'] as const)
    return {
      title: 'From demonstration to experiment',
      prompt: `You want to test whether **${claim}**. Which plan produces the most interpretable comparison?`,
      answer: mcq(rng, 'Predefine one outcome, use equal starting conditions, randomize order, repeat each condition, and record every trial', [
        'Try each option once under whatever conditions are convenient',
        'Let each option use the setup where it performs best',
        'Stop as soon as the preferred option wins twice',
      ]),
      hints: ['Ask what must be held equal.', 'One trial cannot reveal ordinary variation.'],
      explanation: 'Equal conditions isolate the candidate cause; random order spreads time drift; repeats reveal noise; recording every trial prevents stopping-rule cherry-picking.',
      transferBridge: 'Safe household comparisons can be real experiments if measurement and cleanup are appropriate. Ask an adult before using heat, electricity, tools, or chemicals.',
    }
  },
)

const meetingParaphrase = tpl(
  { id: 'real-meeting-paraphrase', name: 'Real Life: Paraphrase a Request', skillIds: ['o-listen'], bucket: 'observer', difficulty: 2, variants: 12, minutes: 2.5, transfer: true },
  (rng) => {
    const msg = pick(rng, [
      { text: 'I can finish the slides tonight, but I need the final numbers by six.', para: 'You will finish tonight if the final numbers arrive by 6 pm.' },
      { text: 'I am not against the event; I am worried that nobody owns cleanup.', para: 'Your concern is unowned cleanup, not the event itself.' },
      { text: 'The draft is clear, but the conclusion makes a stronger claim than the data.', para: 'The writing is clear; the conclusion needs to be narrowed to the evidence.' },
      { text: 'I can meet Tuesday or Thursday, as long as it is after practice.', para: 'Tuesday or Thursday works, but only after practice.' },
    ] as const)
    return {
      title: 'Listen for the condition',
      prompt: `Speaker: “${msg.text}” Which paraphrase preserves the actual request?`,
      answer: mcq(rng, msg.para, [
        'The speaker refuses to help.',
        'The speaker agrees without conditions.',
        'The speaker is angry and should calm down.',
      ]),
      hints: ['Keep the condition, boundary, or distinction.', 'Do not add an emotion the speaker did not name.'],
      explanation: `Accurate paraphrase: **${msg.para}** It preserves the actionable condition without mind-reading.`,
      transferBridge: 'In a real meeting, follow the paraphrase with “Did I get that right?” before solving the problem.',
    }
  },
)

const witnessNotes = tpl(
  { id: 'real-witness-notes', name: 'Real Life: Clean Up Eyewitness Notes', skillIds: ['o-obsinf'], bucket: 'observer', difficulty: 3, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const place = pick(rng, ['hallway', 'bus stop', 'library desk', 'practice room'] as const)
    return {
      title: 'Observation log',
      prompt: `At the ${place}, classify each note before sharing it.`,
      answer: {
        type: 'classify',
        categories: ['Observed', 'Inferred'],
        statements: [
          { text: 'A blue bag was beside the chair at 3:20.', category: 0 },
          { text: 'The owner abandoned it on purpose.', category: 1 },
          { text: 'Two people walked past without touching it.', category: 0 },
          { text: 'Everyone knew it was suspicious.', category: 1 },
        ],
      },
      hints: ['Could a camera record it?', 'Purpose and shared knowledge are interpretations here.'],
      explanation: 'Color, location, time, and visible actions are observations. Intention and what “everyone knew” require separate evidence.',
      transferBridge: 'When accuracy matters, write observations in past tense and interpretations as possibilities: “may,” “could,” “I inferred.”',
    }
  },
)

const repairTest = tpl(
  { id: 'real-repair-test', name: 'Real Life: Separate Competing Causes', skillIds: ['i-hypo'], bucket: 'investigator', difficulty: 4, variants: 16, minutes: 4, transfer: true },
  (rng) => {
    const issue = pick(rng, [
      { symptom: 'a laptop disconnects only at one desk', a: 'the laptop Wi-Fi is failing', b: 'that desk has weak signal', test: 'Use the same laptop at another desk and a second device at the problem desk.' },
      { symptom: 'a plant wilts after moving rooms', a: 'the plant is diseased', b: 'the new room changes light or watering', test: 'Compare light/soil moisture and move a matched plant or the same plant back under controlled care.' },
      { symptom: 'a file export fails for one project', a: 'the export feature is broken', b: 'that project contains a triggering input', test: 'Export a minimal new project, then remove half the original inputs until the failure disappears.' },
      { symptom: 'headphones crackle on one phone', a: 'the headphones are damaged', b: 'the phone jack or settings cause it', test: 'Cross-test the headphones on another device and different headphones on the phone.' },
    ] as const)
    return {
      title: 'The separating test',
      prompt: `Symptom: **${issue.symptom}**. Hypothesis A: ${issue.a}. Hypothesis B: ${issue.b}. What test best separates them?`,
      answer: mcq(rng, issue.test, [
        'Repeat the same setup without changing anything',
        'Ask which hypothesis sounds more common',
        'Replace everything at once and see whether the issue disappears',
      ]),
      hints: ['Change device/context in a crossed comparison.', 'A good result should favor A in one direction and B in another.'],
      explanation: `${issue.test} Crossed tests isolate whether the failure follows the object or the context.`,
      transferBridge: 'The “swap one side” method works for cables, chargers, accounts, rooms, datasets, and many process failures.',
    }
  },
)

const baseRateMessage = tpl(
  { id: 'real-base-rate-message', name: 'Real Life: Size an Alarming Message', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 4, variants: 16, minutes: 4, transfer: true, calibration: true },
  (rng) => {
    const total = 100
    const real = pick(rng, [2, 4, 5, 10] as const)
    const hitsReal = Math.max(1, Math.round(real * 0.8))
    const hitsFalse = pick(rng, [8, 12, 16] as const)
    const posterior = round((100 * hitsReal) / (hitsReal + hitsFalse), 1)
    return {
      title: 'Alarm versus base rate',
      prompt: `Out of ${total} messages like this, ${real} are genuine. A warning flag catches ${hitsReal} genuine messages but also flags ${hitsFalse} false ones. Among flagged messages, about what **percent are genuine**?`,
      answer: { type: 'numeric', answer: posterior, tolerance: 0.11, unit: '%' },
      hints: [`Flagged pool = ${hitsReal} genuine + ${hitsFalse} false.`, 'Genuine fraction = genuine flagged ÷ all flagged.'],
      explanation: `${hitsReal} ÷ (${hitsReal} + ${hitsFalse}) = **${posterior}%**. A useful warning can still have many false alarms when genuine cases are rare. Verify through an independent channel instead of ignoring or obeying automatically.`,
      transferBridge: 'For security alerts, never use the message’s own link to verify it. Open the known app/site or contact the person separately.',
    }
  },
)

const scheduleBuffer = tpl(
  { id: 'real-schedule-buffer', name: 'Real Life: Build a Schedule That Survives', skillIds: ['st-estimate', 'st-premortem'], bucket: 'strategist', difficulty: 3, variants: 16, minutes: 3.5, transfer: true },
  (rng) => {
    const task = rint(rng, 35, 55)
    const setup = rint(rng, 5, 12)
    const travel = rint(rng, 10, 20)
    const buffer = rint(rng, 8, 15)
    const total = task + setup + travel + buffer
    return {
      title: 'Backward from the deadline',
      prompt: `A task needs ${task} min work, ${setup} min setup, ${travel} min travel, and a ${buffer} min uncertainty buffer. How many minutes before the deadline should you start?`,
      answer: { type: 'numeric', answer: total, unit: 'minutes' },
      hints: ['Transitions consume real time.', 'Add work + setup + travel + buffer.'],
      explanation: `${task} + ${setup} + ${travel} + ${buffer} = **${total} minutes**. Plans that budget only “work time” quietly assume materials teleport and nothing varies.`,
      transferBridge: 'Track predicted versus actual totals for a week. Update the buffer from evidence instead of optimism or fear.',
    }
  },
)

const sunkCost = tpl(
  { id: 'real-sunk-cost', name: 'Real Life: Review a Commitment', skillIds: ['st-ev'], bucket: 'strategist', difficulty: 4, variants: 12, minutes: 3.5, transfer: true },
  (rng) => {
    const spent = rint(rng, 3, 9) * 10
    const future = rint(rng, 2, 6) * 10
    return {
      title: 'Past cost, future choice',
      prompt: `You already spent **$${spent}** on a course you no longer use. Continuing costs **$${future} more** and about 12 hours. What belongs in today’s decision?`,
      answer: mcq(rng, `Whether the future benefit is worth $${future} and 12 hours; the $${spent} is gone either way`, [
        `Continue because stopping wastes the $${spent}`,
        `Stop because anything that disappointed you once can never improve`,
        'Ignore both money and time and follow the original plan',
      ]),
      hints: ['Ask which quantities change between today’s options.', 'Past spending is identical under continue and stop.'],
      explanation: `The **$${spent}** is sunk. The live comparison is future value versus **$${future} + 12 hours**, including alternatives for that time.`,
      transferBridge: 'A review is not a verdict on your past self. It is a fresh decision about the next unit of time or money.',
    }
  },
)

const boundaryText = tpl(
  { id: 'real-boundary-text', name: 'Real Life: Send a Clear Boundary', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 2, variants: 12, minutes: 3, transfer: true },
  (rng) => {
    const ask = pick(rng, ['share your account password', 'send your homework answers', 'join a late-night call', 'lend an item you cannot replace'] as const)
    return {
      title: 'Clear, calm, complete',
      prompt: `A peer repeatedly asks you to **${ask}** after you already hesitated. Which message is clearest?`,
      answer: mcq(rng, `“No, I’m not going to ${ask}. Please stop asking. I can help with a safe alternative if there is one.”`, [
        '“Maybe later idk”',
        'A long apology that never actually says no',
        'An insult followed by blocking everyone involved',
      ]),
      hints: ['State the decision, not a debate invitation.', 'A boundary can be calm and still be final.'],
      explanation: 'The message names the boundary and repeat-request limit without attacking the person. An alternative is optional; it does not weaken the no.',
      transferBridge: 'If pressure, threats, sexual content, money, or safety are involved, save evidence and involve a trusted adult or appropriate authority.',
    }
  },
)

const permissionChoice = tpl(
  { id: 'real-permission-choice', name: 'Real Life: Check Consent and Privacy', skillIds: ['h-influence', 'h-boundary'], bucket: 'insight', difficulty: 3, variants: 12, minutes: 3.5, transfer: true },
  (rng) => {
    const scenario = pick(rng, ['upload a group photo', 'add contacts to a club mailing list', 'share a private chat screenshot', 'install an app that reads location history'] as const)
    return {
      title: 'Permission is specific',
      prompt: `Before you **${scenario}**, which action best respects other people’s agency?`,
      answer: mcq(rng, 'Explain exactly what will be shared, with whom and for how long; ask before acting and provide a real no/opt-out', [
        'Assume silence means yes',
        'Hide the details so the choice feels easier',
        'Ask after sharing, because deletion is always complete',
      ]),
      hints: ['Consent needs information and a genuine choice.', 'Permission for one use does not automatically cover another.'],
      explanation: 'Specific, informed, reversible permission preserves agency. Dark patterns manufacture compliance by hiding scope or making refusal costly.',
      transferBridge: 'For apps, inspect permissions at the moment a feature needs them—not during a rushed install—and deny access unrelated to the feature.',
    }
  },
)

const communityAlert = tpl(
  { id: 'real-community-alert', name: 'Real Life: Handle an Unverified Safety Alert', skillIds: ['i-hypo', 'h-influence'], bucket: 'investigator', difficulty: 5, variants: 8, minutes: 5, transfer: true, calibration: true },
  (rng) => {
    const place = pick(rng, ['school entrance', 'community center', 'bus station', 'sports venue'] as const)
    return {
      title: 'Accuracy under urgency',
      prompt: `A forwarded post claims an unspecified danger at the **${place}**, urges everyone to repost immediately, and gives no time, source, or official notice. What response best balances safety, uncertainty, and harm?`,
      answer: mcq(rng, 'Do not amplify the claim; check an official/primary channel, alert a responsible adult or staff member privately, and follow verified safety instructions', [
        'Repost with “not sure if true” so people can decide',
        'Declare it false because details are missing',
        'Go to the location to investigate personally',
      ]),
      hints: ['Urgency can justify verification and safe escalation without public amplification.', 'Do not turn yourself into the field investigator for a possible danger.'],
      explanation: 'This preserves both safety and information hygiene: verify through an independent responsible channel, avoid multiplying an unverified claim, and do not take personal risks.',
      transferBridge: 'For imminent danger, use local emergency guidance. The reasoning skill is not a substitute for trained responders.',
    }
  },
)

const projectTriage = tpl(
  { id: 'real-project-triage', name: 'Real Life: Triage a Failing Group Project', skillIds: ['st-decomp', 'st-ethics'], bucket: 'strategist', difficulty: 5, variants: 8, minutes: 5, transfer: true },
  (rng) => {
    const hours = rint(rng, 18, 30)
    return {
      title: 'Triage, do not panic-plan',
      prompt: `A group deliverable is due in **${hours} hours**. One required section is missing, the evidence table has two unverified numbers, and a teammate is unreachable. Which plan best protects quality and fairness?`,
      answer: mcq(rng, 'Freeze optional polish, assign one owner to verify the numbers, define a minimum complete version, document attempts to reach the teammate, and tell the teacher/client early if scope or attribution must change', [
        'Quietly invent the missing section and put the absent teammate’s name on it',
        'Spend the remaining time redesigning the cover so the project looks finished',
        'Wait until the deadline because contacting the teacher might look weak',
      ]),
      hints: ['Protect the required, verifiable core first.', 'Transparency before the deadline preserves options and fair attribution.'],
      explanation: 'Triage cuts optional scope, secures truth-critical work, creates explicit ownership, and communicates early. Fabrication and false attribution convert a schedule failure into an integrity failure.',
      transferBridge: 'The minimum-complete-version idea works for essays, code, events, and presentations: define what must be true before adding polish.',
    }
  },
)

export const REAL_WORLD_TEMPLATES: ItemTemplate[] = [
  receipt,
  unitPrice,
  commute,
  energyLabel,
  bugReport,
  notificationLoop,
  headlineClaim,
  householdExperiment,
  meetingParaphrase,
  witnessNotes,
  repairTest,
  baseRateMessage,
  scheduleBuffer,
  sunkCost,
  boundaryText,
  permissionChoice,
  communityAlert,
  projectTriage,
]
