/**
 * Authentic Work Studios
 *
 * These are deliberate compressions of real intellectual work, not claims
 * that an offline app can replace a laboratory, editor, senior developer, or
 * seminar. Each preserves the useful workflow: receive a brief, inspect
 * evidence, make checkable intermediate decisions, produce an artifact,
 * compare it with a model, and revise.
 *
 * EVERY graded checkpoint here is deterministic. The written artifact is a
 * `draft`: you write it, you read the model beside the criteria, and the app
 * scores neither. The evidence for the studio comes from the objective
 * checkpoints around it — including the revision probe that follows the
 * draft, which is only answerable if you actually engaged with the artifact.
 */
import type { AnswerSpec, ItemPart, ItemTemplate } from '../../domain/types'
import { mcq, tpl } from '../lib'
import { pick, rint } from '../../engine/rng'

/** An ungraded written artifact: drafted, then compared against the model. */
function draft(
  criteria: string[],
  model: string,
  minWords: number,
  placeholder: string,
): AnswerSpec {
  return { type: 'draft', criteria, model, minWords, placeholder }
}

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

const PROJECT_NAMES = ['school repair café', 'student art night', 'community game evening', 'used-book exchange'] as const

const projectStudio = tpl(
  {
    id: 'studio-project-delivery',
    name: 'Work Studio: Deliver a Real Project',
    skillIds: ['st-decomp', 'st-premortem', 'm-percent'],
    bucket: 'strategist',
    difficulty: 5,
    variants: 8,
    minutes: 24,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'project',
      deliverable: 'a one-page project launch plan',
      simulationNote: 'One planning cycle stands in for several real days; dependencies, budget limits, ownership, and failure modes remain intact.',
    },
  },
  (rng, seed) => {
    const name = PROJECT_NAMES[seed % PROJECT_NAMES.length]
    const budget = rint(rng, 18, 28) * 10
    const venue = rint(rng, 5, 8) * 10
    const supplies = rint(rng, 4, 7) * 10
    const printing = rint(rng, 2, 4) * 10
    const reserveRate = pick(rng, [10, 15, 20] as const)
    const subtotal = venue + supplies + printing
    const reserve = Math.ceil((subtotal * reserveRate) / 100)
    const remaining = budget - subtotal - reserve
    const feasible = remaining >= 0
    const correctBudget = feasible
      ? `Yes — after a ${reserveRate}% reserve, $${remaining} remains`
      : `No — it is $${Math.abs(remaining)} over budget after the reserve`
    return {
      title: `Project room: ${name}`,
      prompt: `You are responsible for taking a **${name}** from idea to a safe, ready-to-run event. The work is simulated; the planning standards are not.`,
      parts: [
        part('Brief', {
          study: `PROJECT BRIEF\n\n- Budget ceiling: **$${budget}**\n- Doors open: Friday, 5:30 pm\n- Capacity: 40 people\n- A staff sponsor must approve the safety plan before publicity promises the date\n- Quotes: venue $${venue}, supplies $${supplies}, printing $${printing}\n- Keep a **${reserveRate}% reserve on quoted costs** for surprises\n- Success: runs safely, begins on time, and stays inside budget`,
          studySeconds: 75,
          prompt: 'Which item is a genuine launch dependency rather than a nice-to-have?',
          answer: mcq(rng, 'Staff approval of the safety plan before publicizing the date', [
            'Settling on the most stylish poster font, since the posters are what people see first',
            'Buying the full range of decorations so the room looks finished on the night itself',
            'Reaching a hundred reactions on the announcement post before the doors are due to open',
          ]),
          explanation: 'A dependency can stop downstream work from being valid. Publicity before approval risks advertising a date that cannot legally or safely run; poster style changes quality, not feasibility.',
        }),
        part('Budget', {
          prompt: `Quoted costs total $${subtotal}. After adding a ${reserveRate}% reserve of $${reserve}, is the plan inside the $${budget} ceiling?`,
          answer: mcq(rng, correctBudget, [
            feasible ? `Yes — $${budget - subtotal} remains because reserves are optional` : `Yes — the quotes are only $${subtotal}`,
            feasible ? `No — every reserve makes a project unaffordable` : `No — it is $${Math.abs(budget - subtotal)} over before considering any reserve`,
            'Cannot be known without attendance numbers',
          ]),
          explanation: `Budget honestly: $${subtotal} quoted + $${reserve} reserve = $${subtotal + reserve}. ${correctBudget}. A reserve is part of the plan, not imaginary unspent money.`,
        }),
        part('Sequence', {
          prompt: 'Put the launch work in dependency order.',
          answer: {
            type: 'order',
            options: [
              'Confirm sponsor, safety constraints, venue, and budget',
              'Assign owners and deadlines for supplies, publicity, setup, and check-in',
              'Publish the approved date and participant instructions',
              'Run a 10-minute tabletop rehearsal and repair the plan',
            ],
            correct: [0, 1, 2, 3],
          },
          explanation: 'Feasibility comes before promises; ownership comes before execution; publicity follows approval; rehearsal tests the assembled plan. Reversing any link creates rework or an unowned risk.',
        }),
        part('Stress-test', {
          prompt: 'The pre-mortem says: “At 5:20 pm nobody knows who has the sign-in list.” Which repair changes the system now?',
          answer: mcq(rng, 'Name one check-in owner, one backup, and a 5:00 pm handoff check', [
            'Tell everyone to be more responsible',
            'Add “sign-in” to a long shared checklist with no owner',
            'Hope the sponsor notices in time',
          ]),
          explanation: 'A repair needs ownership, timing, and a verification point. “Be responsible” changes no condition that produced the failure.',
        }),
        part('Deliver', {
          prompt: 'Write the one-page launch plan. It must be usable by someone who did not attend this planning session.',
          answer: draft(
            [
              'Defines success and non-negotiable constraints (Friday time, capacity, safety approval, budget)',
              'Lists dependency-ordered milestones with a named owner or role and a deadline for each',
              `Shows the $${subtotal} quoted cost, $${reserve} reserve, and whether the plan is feasible`,
              'Includes at least two likely failure modes with concrete prevention or fallback actions',
              'Ends with a go/no-go check that can stop unsafe or unready launch',
            ],
            `Model:\n\n**Outcome:** Run the ${name} Friday at 5:30 for no more than 40 people, safely and within $${budget}. **Go/no-go:** sponsor approves safety plan and venue before publicity. **Budget:** quotes $${subtotal}; ${reserveRate}% reserve $${reserve}; total $${subtotal + reserve}${feasible ? `, leaving $${remaining}` : `, which is $${Math.abs(remaining)} over—reduce supplies or printing before launch`}. **Milestones:** sponsor owns approval by Tuesday; logistics lead confirms venue and supplies Wednesday; communications lead publishes only after approval; event lead runs a Thursday tabletop. **Risks:** missing check-in materials → named owner, backup, 5:00 handoff; supplier delay → confirm Wednesday and keep a local substitute. Friday 3 pm go/no-go verifies approval, materials, owners, and reserve.`,
            110,
            'Write a compact launch plan with outcome, constraints, budget, milestones/owners, risks, and a go/no-go check…',
          ),
          explanation: 'Real plans are coordination artifacts. Someone absent should be able to see what success means, what must happen first, who owns each step, what failure looks like, and when to stop.',
        }),
        part('Revise', {
          prompt: 'A reviewer says your plan has dates but no evidence that work is actually complete. What is the strongest revision?',
          answer: mcq(rng, 'Add observable completion checks to milestones: approval received, receipt logged, rehearsal passed', [
            'Put every deadline in bold so that the dates are impossible for anyone to overlook',
            'Move every date one day earlier, so there is slack in the schedule if any milestone slips',
            'Mark each task “ASAP” so the whole team understands that none of it can be left late',
          ]),
          explanation: 'A deadline states when; a completion check states what must be true. Projects slip when “worked on” is mistaken for “done.”',
        }),
      ],
      hints: ['Separate feasibility dependencies from polish.', 'Budget the reserve as a cost commitment.', 'Every critical task needs an owner, deadline, and observable done condition.'],
      explanation: 'You moved through the real project loop: brief → feasibility → dependencies → pre-mortem → coordination artifact → review. The calendar was compressed, but the decisions were not.',
      transferBridge: 'Use the same one-page structure for a group assignment, club event, trip, or personal build. Replace the fictional constraints with the real ones and keep the go/no-go check.',
    }
  },
)

const WRITING_TOPICS = [
  { program: 'library text reminders', outcome: 'on-time returns', control: 58, treatment: 71, n: 240 },
  { program: 'optional breakfast pickup', outcome: 'first-period attendance', control: 76, treatment: 82, n: 310 },
  { program: 'practice-test workshops', outcome: 'unit-test passes', control: 63, treatment: 75, n: 180 },
  { program: 'covered bike parking', outcome: 'bike commuting', control: 14, treatment: 21, n: 420 },
] as const

const writingStudio = tpl(
  {
    id: 'studio-evidence-writing',
    name: 'Work Studio: Write an Evidence Brief',
    skillIds: ['s-sources', 's-graphs', 'x-explain'],
    bucket: 'science',
    difficulty: 5,
    variants: 8,
    minutes: 23,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'writing',
      deliverable: 'a 120–180 word evidence brief for a real decision-maker',
      simulationNote: 'The sources are original miniatures rather than live publications; source conflict, quantitative evidence, uncertainty, and editorial revision are preserved.',
    },
  },
  (rng, seed) => {
    const topic = WRITING_TOPICS[seed % WRITING_TOPICS.length]
    const diff = topic.treatment - topic.control
    const caveat = pick(rng, ['one semester only', 'one school only', 'participants knew their group', 'the outcome was measured by staff'] as const)
    return {
      title: `Evidence desk: ${topic.program}`,
      prompt: `A school leader wants a short brief on whether to expand **${topic.program}**. Your job is to write to the evidence—not to sell a predetermined answer.`,
      parts: [
        part('Source pack', {
          study: `SOURCE A — evaluation memo\n${topic.n} students were assigned by timetable group to usual practice or ${topic.program}. The measured rate of ${topic.outcome} was ${topic.control}% under usual practice and ${topic.treatment}% with the program. Limitation: ${caveat}.\n\nSOURCE B — student interview\n“I liked it and my friends did too. It definitely works for everyone.”\n\nSOURCE C — provider page\n“Our approach transforms outcomes.” No sample, comparison group, or raw result is reported.`,
          studySeconds: 100,
          prompt: `What is the observed difference in ${topic.outcome}, in **percentage points**?`,
          answer: { type: 'numeric', answer: diff },
          explanation: `${topic.treatment}% − ${topic.control}% = **${diff} percentage points**. Calling it ${diff}% would blur percent with percentage points.`,
        }),
        part('Source judgment', {
          prompt: 'Order the sources from strongest to weakest for the causal question “did the program help?”',
          answer: { type: 'order', options: ['Source A: comparison evaluation', 'Source B: student interview', 'Source C: provider claim'], correct: [0, 1, 2] },
          explanation: 'A structured comparison with numbers is strongest, though limited. An interview is useful for experience and mechanism, not population effect. A seller’s unsupported claim is weakest.',
        }),
        part('Claim size', {
          prompt: 'Which sentence is proportioned to the evidence?',
          answer: mcq(rng, `In this ${topic.n}-student evaluation, the program was associated with a ${diff}-point improvement; ${caveat} limits generalization.`, [
            `The evaluation shows that ${topic.program} improve ${topic.outcome} for everyone by ${diff}%.`,
            'Students liked it, proving the measured effect is causal.',
            'The provider says it transforms outcomes, so expansion is risk-free.',
          ]),
          explanation: 'The honest sentence states the population, comparison, observed magnitude, and limitation. It neither hides the result nor expands it beyond the study.',
        }),
        part('Draft', {
          prompt: 'Write the 120–180 word brief: answer first, use the strongest evidence, handle the weaker sources correctly, and recommend a next action.',
          answer: draft(
            [
              `Leads with a clear answer and the ${diff}-percentage-point result`,
              `Attributes the result to the ${topic.n}-student comparison instead of presenting it as universal fact`,
              `Names the limitation (${caveat}) and explains what it prevents you from claiming`,
              'Uses the interview as experience/context—not proof of effect—and does not rely on the provider claim',
              'Recommends a proportionate next step with a measurement or stop condition',
            ],
            `Model:\n\nThe current evidence supports a **measured expansion** of ${topic.program}, not a universal rollout. In a ${topic.n}-student comparison, the rate of ${topic.outcome} was ${topic.treatment}% with the program versus ${topic.control}% under usual practice—a ${diff}-percentage-point difference. That is the strongest source in the packet. A student interview suggests the program may be acceptable to users, but one enthusiastic account cannot establish the effect; the provider’s unsupported marketing adds little. Because the evaluation covered ${caveat}, we should pilot the program in one additional setting, predefine the same outcome, and compare results after a term. Continue only if the improvement is reproduced without creating a large participation or workload problem.`,
            120,
            'Write 120–180 words for the decision-maker. Start with the answer, then evidence, limitation, and next step…',
          ),
          explanation: 'Serious evidence writing is a sequence of constrained choices: answer the question, quantify, attribute, limit, and recommend. Style matters after those obligations are met.',
        }),
        part('Edit', {
          prompt: 'An editor circles “This proves the program works.” What revision repairs the exact problem?',
          answer: mcq(rng, `“In this evaluation, the program was associated with a ${diff}-point improvement.”`, [
            '“This basically proves the program works.”',
            '“Many people believe the program works.”',
            '“The data is interesting.”',
          ]),
          explanation: 'The revision replaces an absolute causal claim with a bounded statement tied to the actual comparison and effect size.',
        }),
        part('Headline', {
          prompt: 'Choose the headline that keeps both result and uncertainty visible.',
          answer: mcq(rng, `${topic.program}: promising ${diff}-point result, replication needed`, [
            `${topic.program} proven to transform every student`,
            `No conclusion possible about ${topic.program}`,
            `Students love new program`,
          ]),
          explanation: 'A responsible headline does not bury a meaningful result, but it also does not spend more certainty than the evidence earned.',
        }),
      ],
      hints: ['Compute percentage points before writing prose.', 'Give each source only the job it can do.', 'A useful recommendation includes what to measure next and what result would change the decision.'],
      explanation: 'You performed the evidence-writer’s loop: source hierarchy, quantitative claim, calibrated language, audience-facing brief, and line edit.',
      transferBridge: 'Use the same structure for a history paragraph, science report, product memo, or school proposal: answer → best evidence → limitation → next action.',
    }
  },
)

const PROGRAM_TASKS = [
  { name: 'countPassing', noun: 'scores', values: [48, 72, 91, 65, 84], threshold: 70 },
  { name: 'countAffordable', noun: 'prices', values: [12, 8, 19, 7, 15], threshold: 12 },
  { name: 'countOnTime', noun: 'arrival minutes', values: [3, 0, 8, 2, 11], threshold: 5 },
  { name: 'countShortTasks', noun: 'task minutes', values: [15, 35, 20, 50, 10], threshold: 20 },
] as const

const programStudio = tpl(
  {
    id: 'studio-program-build',
    name: 'Work Studio: Build and Review a Program',
    skillIds: ['c-decomp', 'c-trace', 'c-funcs'],
    bucket: 'coding',
    difficulty: 5,
    variants: 4,
    minutes: 24,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'program',
      deliverable: 'a tested JavaScript function plus a short code-review note',
      simulationNote: 'The app checks requirements, traces, implementation choices, and edge cases; your typed implementation is reviewed against a model rather than executed.',
    },
  },
  (rng, seed) => {
    const task = PROGRAM_TASKS[seed % PROGRAM_TASKS.length]
    const inclusive = seed % 2 === 0
    const op = inclusive ? '<=' : '<'
    const english = inclusive ? 'at or below' : 'strictly below'
    const expected = task.values.filter((v) => (inclusive ? v <= task.threshold : v < task.threshold)).length
    const signature = `${task.name}(values, limit)`
    const correctCode = `function ${task.name}(values, limit) {\n  let count = 0;\n  for (const value of values) {\n    if (value ${op} limit) count += 1;\n  }\n  return count;\n}`
    return {
      title: `Developer ticket: ${task.name}`,
      prompt: `Implement a small utility as if another developer will depend on it. The hard part is not typing—it is turning an ambiguous request into a tested contract.`,
      parts: [
        part('Ticket', {
          study: `TICKET\n\nCreate \`${signature}\`. It receives an array of ${task.noun} and returns how many are **${english}** the supplied limit. Do not modify the input array. Empty input returns 0.\n\nExample input: [${task.values.join(', ')}], limit ${task.threshold}.`,
          studySeconds: 75,
          prompt: 'Which item belongs in the acceptance criteria?',
          answer: mcq(rng, `A value equal to the limit ${inclusive ? 'is' : 'is not'} counted`, [
            'The variable names must be one letter long',
            'The function should feel fast',
            'The developer may decide later whether equality counts',
          ]),
          explanation: 'Boundary behavior changes results and must be explicit. Acceptance criteria describe observable behavior, not taste.',
        }),
        part('Test first', {
          prompt: `For [${task.values.join(', ')}] with limit ${task.threshold}, what should the function return?`,
          answer: { type: 'numeric', answer: expected },
          explanation: `The matching values are ${task.values.filter((v) => (inclusive ? v <= task.threshold : v < task.threshold)).join(', ') || 'none'}, so the expected count is **${expected}**. Writing this before code creates an oracle for the implementation.`,
        }),
        part('Implement', {
          prompt: 'Which implementation satisfies the contract?',
          answer: mcq(rng, `\`${correctCode}\``, [
            `\`function ${task.name}(values, limit) { return values.length; }\``,
            `\`function ${task.name}(values, limit) { let count = 0; for (const value of values) if (value ${inclusive ? '<' : '<='} limit) count++; return count; }\``,
            `\`function ${task.name}(values, limit) { values.sort(); return values[0]; }\``,
          ]),
          explanation: `The correct implementation initializes state, visits every value, uses the specified **${op}** boundary, increments only on a match, returns the count, and leaves the array unchanged.`,
        }),
        part('Edge cases', {
          prompt: 'Which tiny test is most likely to catch an equality-boundary bug?',
          answer: mcq(rng, `${task.name}([${task.threshold}], ${task.threshold})`, [
            `${task.name}([], ${task.threshold})`,
            `${task.name}([${task.threshold - 2}], ${task.threshold})`,
            `${task.name}([${task.threshold + 5}], ${task.threshold})`,
          ]),
          explanation: `Only a value exactly equal to the limit distinguishes < from <=. Good tests are chosen to kill a specific plausible bug.`,
        }),
        part('Build', {
          prompt: `Write the implementation and a compact test table. Include normal, empty, equality-boundary, and all-nonmatching cases.`,
          answer: draft(
            [
              `Implements \`${signature}\` with the required ${op} comparison and a returned count`,
              'Does not sort, splice, or otherwise modify the input array',
              `Includes the example with expected result ${expected}`,
              'Includes empty, equality-boundary, and all-nonmatching tests with expected outputs',
              'Explains which bug each boundary test is intended to expose',
            ],
            `Model:\n\n\`${correctCode}\`\n\nTests: \`${task.name}([${task.values.join(', ')}], ${task.threshold}) → ${expected}\`; \`${task.name}([], ${task.threshold}) → 0\`; \`${task.name}([${task.threshold}], ${task.threshold}) → ${inclusive ? 1 : 0}\`; \`${task.name}([${task.threshold + 1}, ${task.threshold + 2}], ${task.threshold}) → 0\`. The equality test kills a < versus <= bug; empty input catches accidental indexing; all-nonmatching catches unconditional increments.`,
            55,
            'Write JavaScript, then list each test as input → expected output and state what bug it targets…',
          ),
          explanation: 'A program is not finished when it looks plausible. It is finished when its contract is explicit and targeted tests can distinguish it from nearby wrong programs.',
        }),
        part('Review', {
          prompt: 'A reviewer asks for one improvement that increases trust without expanding scope. Choose it.',
          answer: mcq(rng, 'Add the boundary tests to the automated suite and document whether equality counts', [
            'Rewrite it with recursion because recursion looks advanced',
            'Add networking and a database',
            'Rename every variable without changing documentation or tests',
          ]),
          explanation: 'The review should reduce ambiguity and regression risk. Cleverness and unrelated features increase surface area without strengthening the contract.',
        }),
      ],
      hints: ['Turn every vague word into observable behavior.', 'Trace before choosing code.', 'Select tests that distinguish the correct implementation from a plausible nearby bug.'],
      explanation: 'This followed a professional micro-cycle: ticket → acceptance criterion → expected output → implementation → adversarial tests → review.',
      transferBridge: 'Before your next real program, write three examples and one boundary case before implementation. That tiny habit prevents a surprising amount of debugging.',
    }
  },
)

const EXPERIMENTS = [
  { subject: 'paper helicopter', outcome: 'flight time (s)', control: [1.8, 2.0, 1.9, 2.1], treatment: [2.3, 2.4, 2.2, 2.5], change: 'longer rotor blades' },
  { subject: 'insulated cup', outcome: 'temperature loss (°C)', control: [12, 11, 13, 12], treatment: [8, 7, 9, 8], change: 'a felt sleeve' },
  { subject: 'paper bridge', outcome: 'load held (coins)', control: [18, 20, 19, 21], treatment: [27, 29, 28, 28], change: 'folded side rails' },
  { subject: 'seed tray', outcome: 'sprouts after 7 days', control: [11, 12, 10, 11], treatment: [15, 14, 16, 15], change: 'daily bottom watering' },
] as const

/**
 * Means are ROUNDED before they are ever displayed. Raw binary floating point
 * printed "0.3999999999999999 flight time higher than control" into the
 * prompt, the options, and the model report. Rounding here also keeps the
 * arithmetic self-consistent: the difference is computed from the same
 * rounded means the learner is shown.
 */
const round2 = (v: number) => Math.round(v * 100) / 100
const mean = (xs: readonly number[]) => round2(xs.reduce((a, b) => a + b, 0) / xs.length)

const experimentStudio = tpl(
  {
    id: 'studio-experiment-cycle',
    name: 'Work Studio: Design and Report an Experiment',
    skillIds: ['s-design', 's-measure', 'm-stats'],
    bucket: 'science',
    difficulty: 5,
    variants: 4,
    minutes: 24,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'experiment',
      deliverable: 'a reproducible methods-and-results report',
      simulationNote: 'Physical trials are replaced by a generated lab notebook; experimental design, analysis, anomaly handling, and reporting remain your work.',
    },
  },
  (rng, seed) => {
    const ex = EXPERIMENTS[seed % EXPERIMENTS.length]
    const controlMean = mean(ex.control)
    const treatmentMean = mean(ex.treatment)
    const direction = treatmentMean > controlMean ? 'higher' : 'lower'
    const difference = round2(Math.abs(treatmentMean - controlMean))
    return {
      title: `Lab notebook: ${ex.subject}`,
      prompt: `Test whether **${ex.change}** changes ${ex.outcome} for a ${ex.subject}. You inherit materials and a clean notebook; you still have to make the study interpretable.`,
      parts: [
        part('Design', {
          study: `QUESTION\nDoes ${ex.change} change ${ex.outcome}?\n\nAvailable: eight nominally identical ${ex.subject} trials, the same measuring tool, and time for four control plus four treatment trials.`,
          studySeconds: 65,
          prompt: 'Which design most directly isolates the proposed change?',
          answer: mcq(rng, 'Randomly assign trial order, change only the treatment feature, and use the same measurement procedure', [
            'Run all controls in the morning and all treatments after lunch with a different measurer',
            'Change the treatment feature and improve the measuring method at the same time',
            'Use the best-looking four objects for treatment',
          ]),
          explanation: 'Random order distributes drift; holding procedure constant isolates the treatment. Selection and simultaneous changes create rival explanations.',
        }),
        part('Analyze', {
          study: `LAB TABLE\n\n| Condition | Trials |\n| --- | --- |\n| Control | ${ex.control.join(', ')} |\n| ${ex.change} | ${ex.treatment.join(', ')} |`,
          studySeconds: 55,
          prompt: `What is the treatment mean?`,
          answer: { type: 'numeric', answer: treatmentMean, tolerance: 0.01 },
          explanation: `(${ex.treatment.join(' + ')}) ÷ ${ex.treatment.length} = **${treatmentMean}**. The control mean is ${controlMean}.`,
        }),
        part('Interpret', {
          prompt: `The treatment mean is ${difference} ${ex.outcome} ${direction} than control. Which conclusion fits four trials per condition?`,
          answer: mcq(rng, `In these trials, ${ex.change} produced a ${difference}-unit ${direction} mean; repeat with more trials before generalizing.`, [
            `It is established that ${ex.change} always cause exactly a ${difference}-unit change.`,
            'The two means came out different, so ordinary measurement noise cannot be what produced the gap.',
            'Four trials per condition is too few to provide any usable evidence about the change at all.',
          ]),
          explanation: 'A small experiment can supply evidence without supplying certainty. State the observed result, scope it to these trials, and name replication.',
        }),
        part('Quality check', {
          prompt: 'One treatment trial was recorded from memory after the sheet was lost. What is the trustworthy action?',
          answer: mcq(rng, 'Mark that value as reconstructed, report analysis with and without it, and repeat the trial if possible', [
            'Keep the reconstructed value in without comment, since it is very probably close to what was measured',
            'Remove the trial quietly if it works against the conclusion the rest of the data already supports',
            'Replace the lost value with the treatment mean, which is the most representative figure available',
          ]),
          explanation: 'The provenance of a measurement is part of the data. Transparent sensitivity analysis shows whether the conclusion depends on the questionable point.',
        }),
        part('Report', {
          prompt: 'Write Methods + Results so another student could repeat the test and a skeptical reader could audit the conclusion.',
          answer: draft(
            [
              `States the independent variable (${ex.change}) and dependent measure (${ex.outcome})`,
              'Describes random trial order and what was held constant with enough detail to reproduce',
              `Reports both means (${controlMean} control, ${treatmentMean} treatment) and the ${difference}-unit difference`,
              'Sizes the conclusion to four trials per condition and distinguishes result from explanation',
              'Names a concrete replication or measurement improvement',
            ],
            `Model:\n\n**Methods:** Eight ${ex.subject} trials were assigned to control or ${ex.change} (four each). Trial order was randomized; materials, operator, environment, and measurement procedure were held constant. The outcome was ${ex.outcome}. **Results:** Control trials (${ex.control.join(', ')}) averaged ${controlMean}; treatment trials (${ex.treatment.join(', ')}) averaged ${treatmentMean}, a ${difference}-unit ${direction} result. In this small test, the use of ${ex.change} was associated with the observed change, but four trials per condition cannot establish a universal effect or mechanism. Repeat with more objects, blinded measurement where practical, and a preregistered exclusion rule.`,
            110,
            'Write reproducible Methods, then numerical Results and a conclusion limited to what the design supports…',
          ),
          explanation: 'A lab report is a handoff. It should let another person reproduce the procedure, recompute the result, and see exactly where interpretation begins.',
        }),
        part('Replicate', {
          prompt: 'Which follow-up most increases confidence in generalization?',
          answer: mcq(rng, 'Repeat on newly made samples with randomized order and the same predefined analysis', [
            'Repeat the strongest treatment trial several times to confirm the best result the design can reach',
            'Report the existing means to more decimal places so the difference between them is stated precisely',
            'Ask the people involved which result they had expected, and compare that with what was measured',
          ]),
          explanation: 'Independent new trials test whether the effect survives fresh samples. Precision formatting cannot manufacture replication.',
        }),
      ],
      hints: ['Change one causal feature; hold the measurement process stable.', 'Report both groups, not just the winning mean.', 'Reproducibility requires operational detail and transparent exceptions.'],
      explanation: 'You completed the experimental loop: isolate → measure → analyze → audit → report → replicate.',
      transferBridge: 'Try the physical version with safe household materials. Photograph the setup and write the exclusion rule before the first trial; then compare your real report with this structure.',
    }
  },
)

const EXCERPTS = [
  {
    title: 'The Map in the Rain',
    text: `Mara had carried the folded map for three days without opening it. In dry weather that looked like confidence. In the rain, with the path dividing beneath identical pines, it looked like pride. She stopped under a cedar and finally unfolded the paper. The ink had bled at the edges, but the contour lines still tightened around the eastern ridge. Her brother had said the river would stay on their left. It now rushed somewhere below and to the right.\n\n“We are not lost,” Mara said, because the sentence arrived before the evidence. Then she crossed it out in her notebook. Below it she wrote: “Our current route conflicts with two independent cues.” The new sentence frightened her less. It did not accuse anyone, and it contained a next move. They walked back to the last marked junction.`,
    thesis: 'Replacing identity-protecting certainty with an evidence-sized statement makes correction possible.',
    evidence: 'Mara crosses out “We are not lost” and records two conflicting cues instead.',
    counter: 'Opening the damaged map also introduces uncertainty; the correction succeeds because she combines it with the river cue.',
  },
  {
    title: 'The Quiet Workshop',
    text: `Mr. Ilyan never repaired a clock while its owner was explaining the problem. He listened with both hands flat on the bench. Only after the story ended did he touch the case. “You hear stopping,” he told Lina. “I need to know whether it stops at the same point.”\n\nThey marked the minute hand and waited. The clock failed at twelve minutes, then twenty-seven, then nine. Lina expected him to look disappointed. Instead he smiled and wrote “not position-dependent.” A failed guess, she realized, had purchased a smaller search space. By noon they had not fixed the clock, but they had eliminated dust on one gear, a warped minute hand, and the owner’s theory about cold mornings. The bench held fewer answers than it had at dawn and more knowledge.`,
    thesis: 'Disciplined elimination can create knowledge before it creates a solution.',
    evidence: 'Each failed hypothesis narrows the search space even though the clock remains broken.',
    counter: 'Elimination alone is insufficient; the workshop still needs a constructive test that identifies the cause.',
  },
  {
    title: 'Borrowed Applause',
    text: `The first version of Jun’s speech earned no applause. The second earned plenty because he had filled it with lines from famous talks. For an hour he felt improved. Then his teacher asked which sentence he would still defend if every famous name were removed.\n\nJun read the pages again. The borrowed lines were polished doors opening into rooms he had never furnished. He kept one statistic whose source he checked, deleted three quotations, and replaced the loudest paragraph with a small story from the bus stop. The third speech sounded less important. It also sounded like someone who could answer questions afterward.`,
    thesis: 'Work becomes defensible when borrowed authority is replaced by checked evidence and owned reasoning.',
    evidence: 'Jun removes impressive quotations and keeps only a verified statistic plus an experience he can explain.',
    counter: 'Borrowed language is not inherently empty; a quotation can contribute when its source and relevance are examined.',
  },
  {
    title: 'The Second Bell',
    text: `At the first bell, everyone in the control room looked at the red gauge. At the second, Nia looked at the window. The gauge claimed the tank was heating quickly, but frost still traced the outside pipe. She did not know which signal was wrong. She only knew they could not both describe the same process.\n\nThe supervisor reached for the shutdown switch. Nia said, “Pause—let’s read the backup sensor before choosing.” It took eight seconds. The backup matched the frost, not the red gauge. A loose wire had turned vibration into a false temperature rise. Later, the report praised the emergency stop system. Nia added a sentence: a safety system that cannot distinguish danger from sensor failure will eventually be ignored.`,
    thesis: 'Reliable safety requires checking independent signals, not merely reacting to the loudest alarm.',
    evidence: 'Nia compares the gauge with frost and a backup sensor before interpreting the alarm.',
    counter: 'Verification must be time-bounded; in some emergencies, an immediate shutdown is safer than an eight-second check.',
  },
] as const

const bookStudio = tpl(
  {
    id: 'studio-book-seminar',
    name: 'Work Studio: Read a Chapter Like a Scholar',
    skillIds: ['x-explain', 'o-recall', 'o-obsinf'],
    bucket: 'meta',
    difficulty: 4,
    variants: 4,
    minutes: 20,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'book',
      deliverable: 'a seminar note with thesis, evidence, inference, and counter-reading',
      simulationNote: 'An original micro-chapter replaces a full book chapter; close reading, delayed recall, interpretation, and accountable discussion moves are preserved.',
    },
  },
  (rng, seed) => {
    const ex = EXCERPTS[seed % EXCERPTS.length]
    return {
      title: `Chapter seminar: ${ex.title}`,
      prompt: 'Read once with attention. Then the text disappears and you must reconstruct what it says before interpreting what it means.',
      parts: [
        part('Read', {
          study: `ORIGINAL EXCERPT — “${ex.title}”\n\n${ex.text}`,
          studySeconds: 120,
          prompt: 'Which event is directly stated rather than inferred?',
          answer: mcq(rng, ex.evidence, [ex.thesis, ex.counter, 'The main character permanently changes personality after this scene.']),
          explanation: `The concrete textual event is: ${ex.evidence} The thesis and counter-reading are interpretations built from events like this.`,
        }),
        part('Thesis', {
          prompt: 'Which thesis best explains the chapter’s central movement without merely retelling it?',
          answer: mcq(rng, ex.thesis, [
            'The chapter sets up a problem, works through a sequence of events, and arrives at an outcome.',
            'The setting is used to show that even genuinely difficult situations tend to have simple answers.',
            'The protagonist turns out to be more capable than the people around her, and the chapter shows it.',
          ]),
          explanation: `A thesis names the pattern the events enact: ${ex.thesis}`,
        }),
        part('Evidence', {
          prompt: 'Which support is strongest for that thesis?',
          answer: mcq(rng, ex.evidence, [
            'The title of the chapter points directly at the idea the passage is built around.',
            'Most readers will recognise the feeling described, which is what gives the passage its force.',
            'The passage is short and tightly written, which makes its central claim unusually clear.',
          ]),
          explanation: 'Strong literary evidence points to a specific choice, contrast, image, or change in the text and explains its connection to the claim.',
        }),
        part('Counter-reading', {
          prompt: 'Which complication would make a seminar comment more intellectually honest?',
          answer: mcq(rng, ex.counter, [
            'No competing reading is available now that a thesis fitting the evidence has already been identified.',
            'Every reading of the passage is supported about equally well, so no single thesis can be preferred.',
            'The passage is best judged on whether it holds a reader’s attention, rather than on its argument.',
          ]),
          explanation: `A counter-reading tests the thesis at its boundary: ${ex.counter}`,
        }),
        part('Seminar note', {
          prompt: 'Write a seminar note: one arguable claim, two concrete details, the reasoning connecting them, and one genuine complication or question.',
          answer: draft(
            [
              'Makes an arguable interpretive claim rather than a plot summary',
              'Uses at least two accurate, concrete details from the excerpt',
              'Explains how each detail supports the claim instead of dropping evidence into the paragraph',
              'Includes a counter-reading, limit, or unresolved question that could move discussion forward',
              'Distinguishes what the text states from what the writer infers',
            ],
            `Model:\n\n“${ex.title}” suggests that **${ex.thesis.toLowerCase()}** The clearest evidence is that ${ex.evidence.charAt(0).toLowerCase() + ex.evidence.slice(1)} This matters because the character changes not only an action but the kind of claim they are willing to defend. A second detail—the contrast built into the scene’s final observation—turns that private correction into a general principle. Still, ${ex.counter.charAt(0).toLowerCase() + ex.counter.slice(1)} My seminar question is: what condition would make the chapter’s preferred method fail?`,
            100,
            'Write an arguable claim, two remembered details with reasoning, and a counter-reading or live seminar question…',
          ),
          explanation: 'A seminar note is not a performance of having read. It is a portable argument another reader can inspect, challenge, and extend.',
        }),
        part('Discuss', {
          prompt: 'A classmate gives a different reading with real textual support. What is the strongest response?',
          answer: mcq(rng, 'Paraphrase their claim, identify the evidence that would distinguish the readings, then revise if theirs explains more', [
            'Restate your own thesis more forcefully, so the strongest version of it is on the table',
            'Say interpretation is subjective so evidence does not matter',
            'Change the subject to whether you liked the story',
          ]),
          explanation: 'Skilled discussion treats disagreement as a comparison between explanatory models. Accurate paraphrase comes before challenge.',
        }),
      ],
      hints: ['Reconstruct concrete events before interpreting.', 'A thesis explains a pattern; it does not summarize everything.', 'A counter-reading strengthens a claim by locating its boundary.'],
      explanation: 'You practiced the chapter-to-seminar pipeline: attentive reading → recall → thesis → evidence → complication → accountable discussion.',
      transferBridge: 'Use the same seminar-note template on ten pages of a real book. Bring the note to a teacher, friend, or reading group and record what evidence changed your view.',
    }
  },
)

const MENTORS = [
  {
    role: 'senior developer',
    learner: 'My program passes the example but fails sometimes. Can you tell me the fix?',
    reply: 'Before a fix, show me the smallest input that fails and what you expected. “Sometimes” hides the shape of the bug.',
    principle: 'Reduce a vague failure to a reproducible case before proposing a repair.',
    challenge: 'Could minimizing the input remove the interaction that causes the bug?',
  },
  {
    role: 'science teacher',
    learner: 'My results support my hypothesis. Is the experiment finished?',
    reply: 'First ask what result would have counted against it, then check whether your design could have produced that result. A test that can only agree is not much of a test.',
    principle: 'Define disconfirming evidence and verify the design could reveal it.',
    challenge: 'What if safety or ethics prevents running the strongest falsifying test?',
  },
  {
    role: 'writing coach',
    learner: 'My essay has lots of sources, but the argument feels weak.',
    reply: 'Count the sentences that explain why evidence changes the claim. Source volume cannot substitute for the reasoning between source and conclusion.',
    principle: 'The explanation connecting evidence to claim is the load-bearing part of an argument.',
    challenge: 'Can a short factual report be strong with little explicit interpretation?',
  },
  {
    role: 'project manager',
    learner: 'Everyone agreed to the plan, but tasks keep slipping.',
    reply: 'Agreement is not ownership. For each deliverable, ask who can say it is done, by when, and what evidence they will show.',
    principle: 'Convert shared intention into named ownership and observable completion.',
    challenge: 'Could too much ownership tracking slow a tiny, fast-moving team?',
  },
] as const

const dialogueStudio = tpl(
  {
    id: 'studio-expert-dialogue',
    name: 'Work Studio: Use Expert Office Hours',
    skillIds: ['o-listen', 'h-emotion', 'x-explain'],
    bucket: 'observer',
    difficulty: 4,
    variants: 4,
    minutes: 18,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'dialogue',
      deliverable: 'a concise expert-consultation note and follow-up message',
      simulationNote: 'The mentor is scripted and cannot inspect your real work; question quality, paraphrase, respectful challenge, teach-back, and follow-through match useful office hours.',
    },
  },
  (rng, seed) => {
    const mentor = MENTORS[seed % MENTORS.length]
    return {
      title: `Office hours: ${mentor.role}`,
      prompt: 'Your goal is not to extract an answer. It is to let a skilled person see your current model, expose the gap, and leave you able to take the next step yourself.',
      parts: [
        part('Prepare', {
          study: `YOU: “${mentor.learner}”\n\n${mentor.role.toUpperCase()}: “${mentor.reply}”`,
          studySeconds: 70,
          prompt: 'What did the expert actually recommend?',
          answer: mcq(rng, mentor.principle, [
            'Hand the whole task to somebody with more experience of this kind of problem.',
            'Collect more information without deciding what it would change.',
            'Trust confidence and experience instead of observable evidence.',
          ]),
          explanation: `The transferable recommendation is: ${mentor.principle}`,
        }),
        part('Paraphrase', {
          prompt: 'Which reply checks understanding instead of merely saying “okay”?',
          answer: mcq(rng, `“So your point is: ${mentor.principle.toLowerCase()} Is that accurate?”`, [
            '“Yeah, I knew that already — it lines up with what I had been assuming so far.”',
            '“Could you just show me the answer, and then I can work backwards from it later?”',
            '“That sounds complicated — I think I will need to go over it a few more times.”',
          ]),
          explanation: 'A paraphrase gives the expert a chance to repair your model before the conversation moves on.',
        }),
        part('Challenge', {
          prompt: 'Which question tests the advice respectfully at a real boundary?',
          answer: mcq(rng, mentor.challenge, [
            'Are you sure that holds in every case, or are there situations where it would not?',
            'What makes you confident about that, given how many other opinions there are on it?',
            'Could you walk me through everything on this topic so I have the full picture first?',
          ]),
          explanation: 'A productive challenge names a condition under which the rule might bend. It creates precision instead of status conflict.',
        }),
        part('Next test', {
          prompt: 'What should happen immediately after office hours?',
          answer: mcq(rng, 'Apply the principle to one concrete example, record the result, and return with the exact point that still fails', [
            'Wait for them to check in again, so the next question comes at a time that suits them',
            'Write the advice into notes in their exact wording so nothing gets lost in paraphrase',
            'Put the same opening question to a second expert, to see whether the two answers agree',
          ]),
          explanation: 'Expert time compounds when advice becomes an experiment. A concrete attempt produces a better next question.',
        }),
        part('Consultation note', {
          prompt: 'Write the note you would keep: original problem, expert’s principle in your own words, boundary question, concrete next test, and what evidence you will bring back.',
          answer: draft(
            [
              'States the original problem specifically enough that another person can understand the block',
              `Accurately paraphrases the principle: ${mentor.principle}`,
              `Uses the boundary question (${mentor.challenge}) or an equally specific limitation`,
              'Defines one immediate application/test and an observable result',
              'Names what evidence or artifact would make a follow-up efficient',
            ],
            `Model:\n\n**Problem:** ${mentor.learner} **Principle learned:** ${mentor.principle} In my words, I need to make the hidden reasoning or completion condition observable before asking for a solution. **Boundary:** ${mentor.challenge} **Next test:** I will apply the principle to one current example today and record the before/after result. **Follow-up evidence:** I will bring the smallest failing example, what I predicted, what happened, and the exact step where my model no longer explains the result.`,
            85,
            'Record the specific problem, expert principle in your own words, a boundary question, your next test, and follow-up evidence…',
          ),
          explanation: 'The note converts a conversation into durable action and preserves enough context for a second meeting to begin where the first ended.',
        }),
        part('Follow up', {
          prompt: 'Which follow-up message uses the expert’s time well?',
          answer: mcq(rng, '“I tried the agreed test. Here was my prediction, here is the result, and this exact step still confuses me. Could you check my reasoning there?”', [
            '“Still a bit confused after trying it. Do you have any more tips I could work through?”',
            '“Could we start again from the beginning? I think I lost the thread somewhere early on.”',
            '“I have written your advice down and will work through it properly later. Thanks a lot.”',
          ]),
          explanation: 'A strong follow-up shows work, isolates the remaining uncertainty, and asks for a bounded kind of help.',
        }),
      ],
      hints: ['Paraphrase before extending.', 'Ask where the rule breaks, not whether the expert is “sure.”', 'Leave with an observable next test and return with evidence.'],
      explanation: 'You practiced the full expert-learning loop: prepare → listen → paraphrase → probe a boundary → apply → follow up with evidence.',
      transferBridge: 'Use this note template in actual teacher office hours. The simulation cannot supply real expertise; its job is to make your next real conversation much better.',
    }
  },
)

const DIFFICULT_CONVERSATIONS = [
  {
    situation: 'a teammate keeps editing your section without asking, then says deadlines leave no time to discuss it',
    need: 'clear ownership and a review step before either person changes the other’s work',
    boundary: 'Do not replace my section without checking with me first.',
    option: 'Use comments for suggested changes and a ten-minute review at 5 pm.',
  },
  {
    situation: 'a friend repeatedly jokes about a private story after you asked them to stop',
    need: 'privacy and confidence that a stated limit will be respected',
    boundary: 'Do not tell or joke about that story again.',
    option: 'We can talk privately if you did not understand why it matters.',
  },
  {
    situation: 'a club leader pressures members to share personal phone numbers in a public document',
    need: 'a privacy-preserving contact method and genuine consent',
    boundary: 'I will not put my private number in a public sheet.',
    option: 'Use the club email or a private, access-controlled contact list.',
  },
  {
    situation: 'a classmate asks to copy your completed work and says refusing means you are not a real friend',
    need: 'protecting academic honesty without abandoning reasonable help',
    boundary: 'I will not send my answers for you to copy.',
    option: 'I can explain one example or study with you before the deadline.',
  },
] as const

const guardianDialogueStudio = tpl(
  {
    id: 'studio-guardian-conversation',
    name: 'Work Studio: Hold a Difficult Conversation',
    skillIds: ['h-boundary', 'h-emotion', 'h-influence'],
    bucket: 'insight',
    difficulty: 5,
    variants: 4,
    minutes: 20,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'dialogue',
      deliverable: 'a boundary conversation plan with escalation criteria',
      simulationNote: 'No scripted exercise can reproduce another person’s emotions; the preparation, wording, listening checks, pressure recognition, and safety escalation are realistic.',
    },
  },
  (rng, seed) => {
    const c = DIFFICULT_CONVERSATIONS[seed % DIFFICULT_CONVERSATIONS.length]
    return {
      title: 'Conversation lab: clear without cruel',
      prompt: `Prepare for this situation: **${c.situation}**. Your goal is not to “win” the conversation—it is to state a workable boundary, understand relevant context, and know what to do if the boundary is ignored.`,
      parts: [
        part('Separate', {
          study: `SITUATION\n${c.situation}\n\nYour underlying need: ${c.need}.`,
          studySeconds: 65,
          prompt: 'Which preparation keeps observation separate from motive-reading?',
          answer: mcq(rng, 'List the specific repeated behavior, its effect, and the change needed—without claiming to know why they do it', [
            'Work out in advance that they do not respect anyone, and prepare the examples that will demonstrate it',
            'Gather a range of other examples from the past that show the same underlying attitude in them',
            'Avoid naming any specific behaviour, so the conversation has the best chance of staying calm and comfortable',
          ]),
          explanation: 'Specific behavior can be confirmed and changed. Motive accusations invite a side argument and often exceed the evidence.',
        }),
        part('Perspective', {
          prompt: 'What is the useful role of perspective-taking before the conversation?',
          answer: mcq(rng, 'Generate possible context so you can listen well, while keeping the boundary intact regardless of guessed motive', [
            'Look for a reading of their situation generous enough that the boundary stops being necessary at all',
            'Work out exactly what they are feeling beforehand and open by telling them what that feeling is',
            'Take responsibility for anticipating and preventing every uncomfortable reaction they might have to it',
          ]),
          explanation: 'Perspective improves tone and questions; it does not require surrendering agency or pretending guesses are facts.',
        }),
        part('Pressure check', {
          prompt: 'They reply, “If you cared about me/the team, you would just allow it.” What is happening?',
          answer: mcq(rng, 'A relationship test is being used to replace discussion of the actual boundary', [
            'They have offered a genuine reason to think the boundary is unfair and worth reconsidering',
            'The boundary stops being valid, because a rule that damages a relationship cannot be the right one',
            'You need to show that you care by giving way this one time, and can hold the line in future',
          ]),
          explanation: 'Conditional belonging (“if you cared…”) pressures compliance without addressing consent, ownership, privacy, or honesty.',
        }),
        part('Opening', {
          prompt: 'Which opening is direct, specific, and leaves room for relevant context?',
          answer: mcq(rng, `“I want to address one specific pattern. ${c.boundary} ${c.option} Is there context I’m missing before we agree on that?”`, [
            '“You always ruin everything.”',
            '“It is probably fine, never mind.”',
            'A ten-minute speech listing every past disagreement',
          ]),
          explanation: 'The opening names the behavior and requested future action, offers a workable path, and asks for context without turning the boundary into a vote.',
        }),
        part('Plan', {
          prompt: 'Write the conversation plan: neutral observation, impact/need, boundary, optional alternative, listening question, likely pressure response, and escalation threshold.',
          answer: draft(
            [
              'Opens with a specific observable behavior rather than “always/never” or a character judgment',
              `States the underlying need (${c.need}) without making the other person responsible for every emotion`,
              `Uses an unambiguous boundary equivalent to: ${c.boundary}`,
              `Offers the alternative (${c.option}) without turning the boundary into negotiation`,
              'Includes a listening/paraphrase step and a calm response to guilt, urgency, or relationship pressure',
              'Defines when to end the conversation and involve a trusted adult, teacher, manager, moderator, or emergency help',
            ],
            `Model:\n\n**Observation:** I want to discuss the specific repeated behavior, not guess your motive. **Impact/need:** I need ${c.need}. **Boundary:** ${c.boundary} **Option:** ${c.option} **Listen:** “What context am I missing?” Then paraphrase the answer before responding. **If pressured:** “Caring about this relationship does not require giving up this boundary. The boundary stays.” **Escalation:** if the behavior repeats, pressure becomes threatening, or there is a safety/power issue, end the conversation, preserve relevant messages, and involve the responsible adult or authority rather than handling it alone.`,
            115,
            'Prepare exact words for observation, need, boundary, option, listening question, pressure response, and escalation threshold…',
          ),
          explanation: 'Planning exact language reduces the chance that stress converts a clear issue into accusation, apology spirals, or accidental negotiation.',
        }),
        part('Escalate', {
          prompt: 'Which condition means this should stop being a private practice conversation?',
          answer: mcq(rng, 'Threats, retaliation, coercion, repeated boundary violations, major power imbalance, or any immediate safety concern', [
            'The other person looks disappointed',
            'You need a few seconds to think',
            'They offer relevant context and ask one clarifying question',
          ]),
          explanation: 'Safety, coercion, and repeated violations require support and documentation. De-escalation does not mean staying alone in an unsafe interaction.',
        }),
      ],
      hints: ['Describe behavior, not character.', 'A listening question can coexist with a firm boundary.', 'Know the exit and escalation conditions before pressure begins.'],
      explanation: 'You practiced a realistic Guardian sequence: separate facts → consider perspective → recognize pressure → state the boundary → listen → escalate when needed.',
      transferBridge: 'For a real high-stakes conversation, rehearse with a trusted person who knows the context. The app cannot assess the other person, power dynamics, or immediate safety.',
    }
  },
)

const FIELD_CASES = [
  {
    incident: 'a borrowed camera is missing after club cleanup',
    facts: ['The checkout sheet lists camera C-4 to Devin at 3:10.', 'A storage photo at 4:05 shows the C-4 slot empty.', 'Devin says, “I put a camera on the return table.”', 'Someone posts, “Devin always loses things.”'],
    categories: [0, 0, 0, 1],
    hypotheses: ['C-4 remained on the return table', 'another member shelved C-4 in the wrong slot', 'Devin left with C-4'],
    test: 'Check the return table, neighboring slots, and camera serials before questioning motives.',
  },
  {
    incident: 'a delivery appears not to have reached the front office',
    facts: ['The carrier scan says “delivered 12:42 — side entrance.”', 'The front desk log has no 12:42 entry.', 'Rain began at 12:30.', 'A message says, “The driver probably stole it.”'],
    categories: [0, 0, 0, 1],
    hypotheses: ['the parcel is at the side entrance', 'someone moved it without logging', 'the scan was attached to the wrong address'],
    test: 'Inspect the named entrance and ask who cleared rain-exposed packages before escalating.',
  },
  {
    incident: 'the rehearsal-room key is absent at opening time',
    facts: ['The sign-out board names Team Blue at 6:00 yesterday.', 'The hook is empty at 7:50 today.', 'The room itself is locked.', 'A student says, “Team Blue does not respect anyone.”'],
    categories: [0, 0, 0, 1],
    hypotheses: ['Team Blue still has the key', 'the key was returned to a different hook', 'a staff member moved it after hours'],
    test: 'Check Team Blue’s return message, adjacent hooks, and the staff movement log in that order.',
  },
] as const

const fieldStudio = tpl(
  {
    id: 'studio-field-investigation',
    name: 'Work Studio: Investigate a Real-Life Incident',
    skillIds: ['i-hypo', 'o-obsinf', 'o-listen'],
    bucket: 'investigator',
    difficulty: 5,
    variants: 3,
    minutes: 20,
    kind: 'multi',
    transfer: true,
    authentic: {
      format: 'fieldwork',
      deliverable: 'a fact-separated incident report with a next-test plan',
      simulationNote: 'The incident records are fictional; observation/inference separation, timeline reconstruction, hypothesis competition, fair interviewing, and calibrated reporting are realistic.',
    },
  },
  (rng, seed) => {
    const c = FIELD_CASES[seed % FIELD_CASES.length]
    return {
      title: `Incident desk: ${c.incident}`,
      prompt: `You are asked what happened because **${c.incident}**. Your report may affect real people, so speed does not excuse unsupported accusation.`,
      parts: [
        part('Intake', {
          study: `INTAKE NOTES\n\n${c.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
          studySeconds: 80,
          prompt: 'Classify each note as observation/reportable record or unsupported interpretation.',
          answer: {
            type: 'classify',
            categories: ['Observation or attributable record', 'Unsupported interpretation'],
            statements: c.facts.map((text, i) => ({ text, category: c.categories[i] })),
          },
          explanation: 'A record can be reported with attribution even if it later proves mistaken. Character claims and motive stories are not incident facts.',
        }),
        part('Hypotheses', {
          prompt: 'Which working stance best protects accuracy?',
          answer: mcq(rng, `Keep all three live: ${c.hypotheses.join('; ')}.`, [
            `Assume ${c.hypotheses[2]} because it is the most blameworthy.`,
            'Go with whichever explanation came up first, because the earliest account is usually the accurate one.',
            'Decline to investigate at all, on the grounds that certainty is not achievable from these records.',
          ]),
          explanation: 'Competing hypotheses prevent one early story from controlling what evidence gets noticed.',
        }),
        part('Next test', {
          prompt: 'What is the highest-value, lowest-harm next action?',
          answer: mcq(rng, c.test, [
            'Name the person the records mention publicly, so that anyone who knows more can come forward.',
            'Search the personal belongings of everyone who had access, so nothing is left unchecked.',
            'Post the most striking version of events publicly, which is the fastest way to bring witnesses forward.',
          ]),
          explanation: `${c.test} It checks high-probability physical/logistical explanations before taking actions that create reputational or privacy harm.`,
        }),
        part('Interview', {
          prompt: 'Which opening question is neutral and information-rich?',
          answer: mcq(rng, '“Walk me through what you did from the last confirmed handoff onward.”', [
            '“Why did you end up losing it — was something distracting you at the time?”',
            '“You did return it at the end, right? I just want to confirm that before I look elsewhere.”',
            '“Who should we blame?”',
          ]),
          explanation: 'A chronological invitation elicits detail without embedding the conclusion. Leading questions contaminate the account you hoped to learn from.',
        }),
        part('Report', {
          prompt: 'Write the incident update: confirmed facts, live hypotheses, tests completed/planned, current confidence, and safeguards against unfair accusation.',
          answer: draft(
            [
              'Separates confirmed observations/attributed records from interpretations',
              `Keeps at least two live hypotheses, including a non-blame explanation`,
              `Names the concrete next test: ${c.test}`,
              'Uses calibrated language and explicitly states what is not yet known',
              'Avoids unnecessary names, character judgments, or public escalation',
            ],
            `Model:\n\n**Known:** ${c.facts.slice(0, 3).join(' ')} The character claim in note 4 is not evidence about this incident. **Live explanations:** ${c.hypotheses.join('; ')}. **Next test:** ${c.test} After those checks, ask involved people for a chronological account using the same neutral prompt. **Current assessment:** cause unknown; confidence is low until physical records and handoffs are reconciled. Share only with the people responsible for recovery, and do not attach blame to a person without evidence that distinguishes the competing explanations.`,
            100,
            'Write a fact-separated incident update with live hypotheses, next tests, confidence, and fairness safeguards…',
          ),
          explanation: 'An incident report should help the next person recover the truth. It is not a container for suspicion or a performance of certainty.',
        }),
        part('Update', {
          prompt: 'The item is found in an adjacent location. What belongs in the corrected report?',
          answer: mcq(rng, 'Record where it was found, close unsupported hypotheses, note the process gap, and avoid pretending the initial suspicion was reasonable evidence', [
            'Delete the entire report so nobody sees the error',
            'Keep blaming the original person because they were suspicious',
            'Announce that the case was solved through intuition',
          ]),
          explanation: 'Corrections should update facts and improve the system. Owning the earlier uncertainty is part of trustworthy investigation.',
        }),
      ],
      hints: ['Attribute records; do not silently convert them into truth.', 'Keep multiple explanations until a test separates them.', 'Choose reversible, low-harm tests before accusation or intrusion.'],
      explanation: 'You practiced an ethical investigation cycle: intake → separation → competing hypotheses → cheap test → neutral interview → report → correction.',
      transferBridge: 'For a real missing item or misunderstanding, use a private three-column note: known, possible, next check. Escalate to a responsible adult when safety or permission boundaries matter.',
    }
  },
)

const decisionStudio = tpl(
  {
    id: 'studio-real-life-decision',
    name: 'Work Studio: Make a Defensible Real-Life Decision',
    skillIds: ['st-ev', 'st-ethics', 'i-forecast'],
    bucket: 'strategist',
    difficulty: 5,
    variants: 12,
    minutes: 20,
    kind: 'multi',
    transfer: true,
    calibration: true,
    authentic: {
      format: 'decision',
      deliverable: 'a decision memo with assumptions, numbers, safeguards, and a review trigger',
      simulationNote: 'Prices and constraints are generated, but the memo must handle opportunity cost, uncertainty, nonfinancial constraints, reversibility, and ethics like a real choice.',
    },
  },
  (rng) => {
    const baseA = rint(rng, 4, 8) * 5
    const useA = rint(rng, 2, 4)
    const baseB = rint(rng, 1, 3) * 5
    const useB = useA + rint(rng, 2, 4)
    const expectedUses = rint(rng, 6, 14)
    const costA = baseA + useA * expectedUses
    const costB = baseB + useB * expectedUses
    const cheaper = costA <= costB ? 'Plan A' : 'Plan B'
    const breakEven = (baseA - baseB) / (useB - useA)
    return {
      title: 'Decision room: membership or pay-as-you-go',
      prompt: 'Choose between two realistic service plans. The correct process must survive a change in usage, a hidden constraint, and a future review—not just today’s arithmetic.',
      parts: [
        part('Frame', {
          study: `OPTIONS\n\n| | Monthly fee | Per use | Cancellation |\n| --- | ---: | ---: | --- |\n| Plan A | $${baseA} | $${useA} | any month |\n| Plan B | $${baseB} | $${useB} | any month |\n\nExpected use next month: **${expectedUses} times**. Plan A stores attendance history for personalization; Plan B stores only payment records.`,
          studySeconds: 75,
          prompt: 'What is Plan A’s expected monthly cost?',
          answer: { type: 'numeric', answer: costA },
          explanation: `$${baseA} + ${expectedUses} × $${useA} = **$${costA}**.`,
        }),
        part('Compare', {
          prompt: `Plan B costs $${costB} at ${expectedUses} uses. Which is cheaper on the stated forecast?`,
          answer: mcq(rng, `${cheaper} — A is $${costA}, B is $${costB}`, [
            costA <= costB ? `Plan B — its base fee is lower` : `Plan A — its per-use fee is lower`,
            'They cost the same at every usage level',
            'Choose the plan with more data collection because personalization is always worth it',
          ]),
          explanation: `At the forecast, A = $${costA} and B = $${costB}. Fixed and variable costs must be combined at your usage—not compared one column at a time.`,
        }),
        part('Stress-test', {
          prompt: `The break-even use is ${breakEven.toFixed(1)} visits. What should that change in your reasoning?`,
          answer: mcq(rng, 'Usage uncertainty near the break-even could flip the price winner, so test low/likely/high usage', [
            'Nothing; one forecast is certain once written down',
            'Always choose the high-fee plan above break-even',
            'Break-even makes nonfinancial constraints irrelevant',
          ]),
          explanation: 'A decision is fragile when plausible usage crosses the break-even. Sensitivity analysis reveals whether the recommendation depends on a shaky assumption.',
        }),
        part('Constraint', {
          prompt: 'You do not want attendance history retained. What is the ethical decision move?',
          answer: mcq(rng, 'Treat privacy as an explicit constraint or cost, check retention controls, and do not hide it behind the cheaper price', [
            'Ignore privacy because it has no dollar amount',
            'Assume the company will use data responsibly',
            'Invent a dollar value that guarantees the preferred answer',
          ]),
          explanation: 'Not every value belongs in one fake-precise number. A decision memo can state a threshold: if attendance storage cannot be disabled, choose the alternative.',
        }),
        part('Memo', {
          prompt: 'Write the decision memo: objective, numerical comparison, key assumptions, privacy constraint, choice, and review trigger.',
          answer: draft(
            [
              `Computes A = $${costA} and B = $${costB} at ${expectedUses} expected uses`,
              `Uses the ${breakEven.toFixed(1)}-use break-even to discuss low/likely/high sensitivity`,
              'States privacy as a real constraint and specifies what setting/policy must be verified',
              'Makes a choice that follows from stated priorities rather than pretending one answer fits everyone',
              'Includes a reversible trial or dated review trigger with evidence to collect',
            ],
            `Model:\n\n**Objective:** obtain the service at reasonable cost without retaining attendance history. At ${expectedUses} uses, Plan A costs $${costA}; Plan B costs $${costB}, so ${cheaper} wins on the central price forecast. The plans cross near ${breakEven.toFixed(1)} uses, so I would also calculate a low and high month before treating that saving as stable. Privacy is a constraint, not a rounding error: verify whether Plan A’s attendance storage can be disabled and deleted. **Decision:** choose ${cheaper} only if it meets that constraint; otherwise choose the privacy-preserving option. Use it for one cancellable month, record actual visits and fees, verify stored data, then review on the final day before renewal.`,
            105,
            'Write a decision memo with objective, cost comparison, assumptions/sensitivity, privacy constraint, choice, and review trigger…',
          ),
          explanation: 'A defensible decision exposes its assumptions and values. It also creates a future moment when reality can overrule the forecast.',
        }),
        part('Review', {
          prompt: 'After one month, what evidence should drive the review?',
          answer: mcq(rng, 'Actual uses, total billed cost, observed data retention, and whether the original objective was met', [
            'Whether switching now feels embarrassing',
            'Only the advertised monthly fee',
            'How many friends chose each plan',
          ]),
          explanation: 'The review compares predictions and constraints with observed reality. Sunk pride and popularity do not answer the original decision.',
        }),
      ],
      hints: ['Combine fixed and variable costs at a forecasted usage.', 'Stress-test assumptions near a break-even.', 'Keep nonfinancial constraints visible and schedule a reversible review.'],
      explanation: 'You completed a real decision cycle: frame → calculate → sensitivity → values/constraints → memo → feedback review.',
      transferBridge: 'Use the memo on a real subscription, club commitment, or purchase. Replace generated prices with the actual terms and screenshot the cancellation/data policy before deciding.',
    }
  },
)

export const AUTHENTIC_WORK_TEMPLATES: ItemTemplate[] = [
  projectStudio,
  writingStudio,
  programStudio,
  experimentStudio,
  bookStudio,
  dialogueStudio,
  guardianDialogueStudio,
  fieldStudio,
  decisionStudio,
]
