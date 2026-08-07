/**
 * Short real-world transfer practice. Unlike the longer Work Studios, these
 * are 2–5 minute decisions built from receipts, schedules, messages, service
 * terms, bug reports, household measurements, and public claims. Every answer
 * is authored or computed and passes through the normal content audit.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, money, round, tpl} from '../lib'
import { pick, rint } from '../../engine/rng'

const receipt = tpl(
  { id: 'real-receipt-check', name: 'Real Life: Check the Receipt', skillIds: ['m-percent'], bucket: 'math', difficulty: 2, variants: 20, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const subtotal = rint(rng, 8, 32)
    const rate = cycle(seed, [10, 15, 20] as const)
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
  { id: 'real-commute-time', name: 'Real Life: Travel-Time Check', skillIds: ['p-motion'], bucket: 'physics', difficulty: 2, variants: 11, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const distance = rint(rng, 3, 12)
    const speed = cycle(seed, [3, 4, 6] as const)
    const minutes = (distance / speed) * 60
    return {
      title: 'Can the travel claim be true?',
      prompt: `A route is **${distance} km**. At an average moving speed of **${speed} km/h**, how many minutes does the travel itself take?`,
      answer: { type: 'numeric', answer: minutes, tolerance: 0.01, unit: 'minutes' },
      hints: ['Time = distance ÷ speed.', 'The result is in hours; multiply by 60.'],
      explanation: `${distance} ÷ ${speed} = ${round(distance / speed, 3)} hours = **${minutes} minutes**. This excludes waiting, parking, and delays—real arrival plans need a buffer beyond the physics minimum.`,
      transferBridge: 'Separate moving time from door-to-door time. Hidden transitions are where real schedules usually fail.',
    }
  },
)

const energyLabel = tpl(
  { id: 'real-energy-label', name: 'Real Life: Appliance Energy', skillIds: ['p-energy'], bucket: 'physics', difficulty: 3, variants: 18, minutes: 3, transfer: true },
  (rng, seed) => {
    const watts = cycle(seed, [40, 60, 80, 100] as const)
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
  { id: 'real-bug-report', name: 'Real Life: Write a Reproducible Bug Report', skillIds: ['c-trace'], bucket: 'coding', difficulty: 3, variants: 4, minutes: 3, transfer: true },
  (rng, seed) => {
    const feature = cycle(seed, ['Save button', 'search filter', 'dark-mode toggle', 'assignment sorter'] as const)
    return {
      title: 'Bug triage',
      prompt: `Someone reports: “The **${feature}** is broken sometimes.” Which follow-up creates the most useful bug report?`,
      answer: mcq(rng, 'Record exact starting state, numbered actions, expected result, actual result, and whether the sequence reproduces twice', [
        'Collect how often it happens and how badly it disrupts them, then rank the report against other open issues by severity',
        'Rewrite the feature the way it probably should have worked, then ask the reporter to confirm the problem has gone away',
        'Ask for the browser, device, and app version, and close the report if the setup is one the team does not officially support',
      ]),
      hints: ['A developer needs to make the failure happen on demand.', 'Separate expected behavior from observed behavior.'],
      explanation: 'Reproduction steps turn a complaint into a test. Starting state matters because many intermittent bugs depend on hidden state left by an earlier action.',
      transferBridge: 'This structure also improves reports about broken devices, confusing instructions, and process failures.',
    }
  },
)

const notificationLoop = tpl(
  { id: 'real-notification-loop', name: 'Real Life: Trace an Automation', skillIds: ['c-loops', 'c-bool'], bucket: 'coding', difficulty: 3, variants: 20, minutes: 3, transfer: true },
  (rng, seed) => {
    const days = Array.from({ length: 6 }, () => rint(rng, 0, 3))
    const threshold = cycle(seed, [1, 2] as const)
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
  (rng, seed) => {
    const group = cycle(seed, ['students who sleep more', 'people who walk to work', 'teens who eat breakfast', 'players who practice daily'] as const)
    const outcome = cycle(Math.floor(seed / 4), ['report higher grades', 'report lower stress', 'miss fewer days', 'win more matches'] as const)
    return {
      title: 'Headline versus study',
      prompt: `Headline: “New study proves the habit causes success.” Study detail: a one-time survey finds **${group} ${outcome}**. Which rewrite matches the design?`,
      answer: mcq(rng, `Survey finds an association: ${group} ${outcome}; causal direction remains unknown`, [
        `The study establishes that the habit causes the outcome, since ${group} ${outcome}`,
        `The study shows the causation runs the other way: the outcome is what leads people into the habit`,
        `Because nobody was assigned the habit, the survey cannot support any claim about these two things`,
      ]),
      hints: ['A one-time survey observes; it does not assign the habit.', 'Name association and the missing causal direction.'],
      explanation: 'The relationship may be real while its cause remains unresolved. Confounds and reverse causation are live until design—not confident wording—rules them out.',
      transferBridge: 'Read past the headline for assignment, timing, comparison group, sample, and measured outcome.',
    }
  },
)

const householdExperiment = tpl(
  { id: 'real-household-experiment', name: 'Real Life: Improve a Household Test', skillIds: ['s-design'], bucket: 'science', difficulty: 4, variants: 4, minutes: 4, transfer: true },
  (rng, seed) => {
    const claim = cycle(seed, ['one towel brand absorbs more', 'one battery lasts longer', 'one insulation material slows cooling', 'one soil mix retains more water'] as const)
    return {
      title: 'From demonstration to experiment',
      prompt: `You want to test whether **${claim}**. Which plan produces the most interpretable comparison?`,
      answer: mcq(rng, 'Predefine one outcome, use equal starting conditions, randomize order, repeat each condition, and record every trial', [
        'Run each option several times under everyday conditions, so the result reflects how they really get used rather than a lab setup',
        'Give each option the setup where it performs at its best, so every candidate is judged fairly at its own peak performance',
        'Repeat the comparison until one option has clearly won more often than the other, then stop and record that as the result',
      ]),
      hints: ['Ask what must be held equal.', 'One trial cannot reveal ordinary variation.'],
      explanation: 'Equal conditions isolate the candidate cause; random order spreads time drift; repeats reveal noise; recording every trial prevents stopping-rule cherry-picking.',
      transferBridge: 'Safe household comparisons can be real experiments if measurement and cleanup are appropriate. Ask an adult before using heat, electricity, tools, or chemicals.',
    }
  },
)

const meetingParaphrase = tpl(
  { id: 'real-meeting-paraphrase', name: 'Real Life: Paraphrase a Request', skillIds: ['o-listen'], bucket: 'observer', difficulty: 2, variants: 1, minutes: 2.5, transfer: true },
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
        'The speaker has agreed to do it, so the work can be treated as settled.',
        'The speaker is raising an objection and does not really want to do this.',
        'The speaker is frustrated with how the whole thing has been organised.',
      ]),
      hints: ['Keep the condition, boundary, or distinction.', 'Do not add an emotion the speaker did not name.'],
      explanation: `Accurate paraphrase: **${msg.para}** It preserves the actionable condition without mind-reading.`,
      transferBridge: 'In a real meeting, follow the paraphrase with “Did I get that right?” before solving the problem.',
    }
  },
)

const witnessNotes = tpl(
  { id: 'real-witness-notes', name: 'Real Life: Clean Up Eyewitness Notes', skillIds: ['o-obsinf'], bucket: 'observer', difficulty: 3, variants: 1, minutes: 3, transfer: true },
  (_rng, seed) => {
    const place = cycle(seed, ['hallway', 'bus stop', 'library desk', 'practice room'] as const)
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
  { id: 'real-repair-test', name: 'Real Life: Separate Competing Causes', skillIds: ['i-hypo'], bucket: 'investigator', difficulty: 4, variants: 1, minutes: 4, transfer: true },
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
        'Repeat the exact same setup several more times and see whether the failure shows up consistently enough to be believed',
        'Work out which of the two explanations is the more common cause in general, and treat that one as the likely answer here',
        'Replace or reset everything involved at once, then check whether the problem has disappeared afterwards',
      ]),
      hints: ['Change device/context in a crossed comparison.', 'A good result should favor A in one direction and B in another.'],
      explanation: `${issue.test} Crossed tests isolate whether the failure follows the object or the context.`,
      transferBridge: 'The “swap one side” method works for cables, chargers, accounts, rooms, datasets, and many process failures.',
    }
  },
)

const baseRateMessage = tpl(
  { id: 'real-base-rate-message', name: 'Real Life: Size an Alarming Message', skillIds: ['i-bayes'], bucket: 'investigator', difficulty: 4, variants: 4, minutes: 4, transfer: true, calibration: true },
  (_rng, seed) => {
    const total = 100
    const real = cycle(seed, [2, 4, 5, 10] as const)
    const hitsReal = Math.max(1, Math.round(real * 0.8))
    const hitsFalse = cycle(Math.floor(seed / 4), [8, 12, 16] as const)
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
        `Whether stopping now would waste the $${spent} already paid, which continuing would at least put to some use`,
        `Whether something that has already disappointed you once is realistically going to be worth returning to`,
        `Whether abandoning the plan you committed to sets a habit of quitting things partway through`,
      ]),
      hints: ['Ask which quantities change between today’s options.', 'Past spending is identical under continue and stop.'],
      explanation: `The **$${spent}** is sunk. The live comparison is future value versus **$${future} + 12 hours**, including alternatives for that time.`,
      transferBridge: 'A review is not a verdict on your past self. It is a fresh decision about the next unit of time or money.',
    }
  },
)

const boundaryText = tpl(
  { id: 'real-boundary-text', name: 'Real Life: Send a Clear Boundary', skillIds: ['h-boundary'], bucket: 'insight', difficulty: 2, variants: 4, minutes: 3, transfer: true },
  (rng, seed) => {
    const ask = cycle(seed, ['share your account password', 'send your homework answers', 'join a late-night call', 'lend an item you cannot replace'] as const)
    return {
      title: 'Clear, calm, complete',
      prompt: `A peer repeatedly asks you to **${ask}** after you already hesitated. Which message is clearest?`,
      answer: mcq(rng, `“No, I’m not going to ${ask}. Please stop asking. I can help with a safe alternative if there is one.”`, [
        `“I really can’t right now, maybe another time — sorry, it’s complicated to explain properly.”`,
        `“I’m sorry, I feel bad about this, I know you need it and I hate saying no, please don’t be upset.”`,
        `“Stop asking me things like this. I’m done with this conversation and with everyone involved in it.”`,
      ]),
      hints: ['State the decision, not a debate invitation.', 'A boundary can be calm and still be final.'],
      explanation: 'The message names the boundary and repeat-request limit without attacking the person. An alternative is optional; it does not weaken the no.',
      transferBridge: 'If pressure, threats, sexual content, money, or safety are involved, save evidence and involve a trusted adult or appropriate authority.',
    }
  },
)

const permissionChoice = tpl(
  { id: 'real-permission-choice', name: 'Real Life: Check Consent and Privacy', skillIds: ['h-influence', 'h-boundary'], bucket: 'insight', difficulty: 3, variants: 4, minutes: 3.5, transfer: true },
  (rng, seed) => {
    const scenario = cycle(seed, ['upload a group photo', 'add contacts to a club mailing list', 'share a private chat screenshot', 'install an app that reads location history'] as const)
    return {
      title: 'Permission is specific',
      prompt: `Before you **${scenario}**, which action best respects other people’s agency?`,
      answer: mcq(rng, 'Explain exactly what will be shared, with whom and for how long; ask before acting and provide a real no/opt-out', [
        'Give everyone a chance to object beforehand, and treat nobody raising a concern as agreement to go ahead',
        'Keep the explanation short and simple so the choice is easy to make and nobody feels pressured by detail',
        'Share it first and ask afterwards, offering to take it straight down for anyone who turns out to mind',
      ]),
      hints: ['Consent needs information and a genuine choice.', 'Permission for one use does not automatically cover another.'],
      explanation: 'Specific, informed, reversible permission preserves agency. Dark patterns manufacture compliance by hiding scope or making refusal costly.',
      transferBridge: 'For apps, inspect permissions at the moment a feature needs them—not during a rushed install—and deny access unrelated to the feature.',
    }
  },
)

const communityAlert = tpl(
  { id: 'real-community-alert', name: 'Real Life: Handle an Unverified Safety Alert', skillIds: ['i-hypo', 'h-influence'], bucket: 'investigator', difficulty: 5, variants: 4, minutes: 5, transfer: true, calibration: true },
  (rng, seed) => {
    const place = cycle(seed, ['school entrance', 'community center', 'bus station', 'sports venue'] as const)
    return {
      title: 'Accuracy under urgency',
      prompt: `A forwarded post claims an unspecified danger at the **${place}**, urges everyone to repost immediately, and gives no time, source, or official notice. What response best balances safety, uncertainty, and harm?`,
      answer: mcq(rng, 'Do not amplify the claim; check an official/primary channel, alert a responsible adult or staff member privately, and follow verified safety instructions', [
        'Pass it on with a clear note that it is unconfirmed, so people nearby can judge the risk and decide for themselves',
        'Treat it as false and say so, since a real warning would have carried a time, a source, and an official notice',
        'Go and look for yourself before saying anything, so that whatever you pass on afterwards is something you verified',
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
        'Write the missing section yourself and leave the absent teammate credited, so the group is not penalised for one person',
        'Put the remaining hours into presentation and layout, so that what does exist reads as finished and considered work',
        'Hold off on contacting anyone until the deadline, since the situation may still resolve and early warnings invite scrutiny',
      ]),
      hints: ['Protect the required, verifiable core first.', 'Transparency before the deadline preserves options and fair attribution.'],
      explanation: 'Triage cuts optional scope, secures truth-critical work, creates explicit ownership, and communicates early. Fabrication and false attribution convert a schedule failure into an integrity failure.',
      transferBridge: 'The minimum-complete-version idea works for essays, code, events, and presentations: define what must be true before adding polish.',
    }
  },
)

const packingConstraints = tpl(
  { id: 'real-packing-constraints', name: 'Real Life: Pack Under Constraints', skillIds: ['z-deduce'], bucket: 'puzzle', difficulty: 4, variants: 4, minutes: 4, transfer: true },
  (rng, seed) => {
    const setting = cycle(seed, ['equipment shelf', 'delivery cart', 'storage locker', 'stage supply rack'] as const)
    return {
      title: 'Constraint-safe packing',
      prompt: `Four labeled cases must go left-to-right on one **${setting}**: **C**amera, **T**oolbox, **B**attery, and **F**irst-aid kit. The toolbox must be immediately left of the battery; first aid must be at an end; and first aid cannot touch the camera. Which loading order satisfies every constraint?`,
      answer: mcq(rng, 'C – T – B – F', [
        'T – B – C – F',
        'F – C – T – B',
        'C – B – T – F',
      ]),
      hints: ['Treat “immediately left” as one locked T–B block.', 'Test the end condition and the no-touch condition separately.'],
      explanation: '**C – T – B – F** keeps T immediately left of B, puts F at an end, and separates F from C. Each distractor breaks at least one named constraint.',
      transferBridge: 'Real packing, seating, and scheduling become easier when you lock the strongest constraint first, then test every remaining rule before committing.',
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
  packingConstraints,
]
