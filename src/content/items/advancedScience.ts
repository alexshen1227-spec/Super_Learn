/**
 * Advanced tier for scientific reasoning — the last bucket left thin (13%
 * above difficulty 3 after the physics and coding pass).
 *
 * What "hard" means in this bucket is not harder arithmetic. It is holding a
 * claim, its evidence, and the gap between them in mind at once, and saying
 * what would settle it. Every item below has a right answer that a careful
 * reader can defend from the text, and distractors that are each a REAL
 * mistake — the plausible reading, the over-correction, the true-but-irrelevant
 * fact — rather than obvious filler.
 *
 * The over-correction distractors matter. A learner taught only to be
 * sceptical becomes a learner who dismisses everything, which is its own
 * failure mode and one this app should not manufacture. Several items here
 * score "reject it" as WRONG.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, numeric, round, tpl } from '../lib'

/** Confounds that survive a control — the study looks clean and is not. */
const hiddenConfound = tpl(
  { id: 'advs-confound', name: 'What else changed?', skillIds: ['s-hypo'], bucket: 'science', difficulty: 4, variants: 4, minutes: 3, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        setup:
          'A school adds a breakfast club and reading scores rise that year. The study controls for family income, class size, and teacher experience.',
        q: 'What is the most serious remaining explanation?',
        correct: 'The families who chose to attend may differ from those who did not, in ways income does not capture',
        wrong: [
          'Reading scores naturally rise every year anyway, as the students get older',
          'One single year is not nearly long enough for any educational effect to appear',
          'Breakfast cannot plausibly affect reading at all, so the result here must simply be an error',
        ],
        why: 'Controlling for measured variables does nothing about self-selection: the families who sign up may be more organised, more available in the mornings, or more engaged with school generally. Age-related growth is real but would show in the comparison group too. The last option is the over-correction — dismissing a plausible mechanism because the design is imperfect.',
      },
      {
        setup:
          'A hospital finds patients treated with a new surgical technique recover faster than those given the old one. Surgeons chose which technique to use for each patient.',
        q: 'What is the central problem?',
        correct: 'Surgeons likely chose the new technique for healthier patients, so the groups differed before treatment',
        wrong: [
          'Surgeons may well be biased in favour of the new technique when they assess recovery afterwards',
          'The sample of patients here is probably far too small to detect any real difference',
          'Recovery speed is a subjective thing and cannot be measured at all reliably',
        ],
        why: 'When the treating clinician assigns the treatment, the assignment carries their judgment about the patient — that is confounding by indication, and it can manufacture an effect from nothing. Assessment bias is a real second problem, but it distorts the measurement rather than the groups themselves.',
      },
      {
        setup:
          'Students using a new study app score higher on the end-of-year exam than students who did not use it. The app was free and optional.',
        q: 'What would most improve the evidence, without a randomised trial?',
        correct: 'Compare each student against their OWN prior scores, so each acts as their own baseline',
        wrong: [
          'Survey the app users about how helpful they found it',
          'Increase the number of students until the difference is statistically significant',
          'Compare the app users against the national average instead',
        ],
        why: 'Within-person comparison removes every stable difference between the groups at once — motivation, prior attainment, home support — without needing to name them. Asking users is self-report about a thing they chose; a bigger sample makes a biased estimate more precise, not more correct.',
      },
      {
        setup:
          'A town installs brighter street lighting and reported crime falls by 20% the following year.',
        q: 'Which alternative explanation is hardest to rule out from this alone?',
        correct: 'Reported crime and actual crime are different things, and lighting can change reporting as well as offending',
        wrong: [
          'Crime naturally varies year to year, so a single year proves nothing at all',
          'The money spent on lighting could have been spent more effectively elsewhere',
          'Criminals may simply have moved to neighbouring areas rather than stopping',
        ],
        why: 'The outcome measured is REPORTS, and better lighting plausibly changes who notices and who bothers reporting. Displacement is a genuine rival too, but it is at least testable from neighbouring-area data. The cost question is about policy, not about whether the effect is real.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'The problem the controls missed',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask how people ended up in each group. If they chose, the choice itself may be the cause.',
        'Separate problems with the GROUPS from problems with the MEASUREMENT — they need different fixes.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nControlling for the variables you thought of is not the same as controlling for the ones that matter. When people select themselves into a group, the selection can carry every unmeasured difference with it.`,
      commonErrors: {
        concept: 'Treating a list of controlled variables as proof of a clean comparison. Controls only handle what was measured.',
      },
    }
  },
)

/** Sample size and precision — the one place hard numbers belong here. */
const precisionCost = tpl(
  { id: 'advs-precision', name: 'What another sample buys', skillIds: ['s-measure'], bucket: 'science', difficulty: 4, variants: 12, minutes: 3 },
  (_rng, seed) => {
    const n1 = [25, 100, 400][seed % 3]
    const mult = [4, 9, 16][Math.floor(seed / 3) % 3]
    const n2 = n1 * mult
    const improvement = Math.sqrt(mult)
    return {
      title: 'How much better is a bigger sample?',
      prompt: `A survey of **${n1}** people has a margin of error of **±4.0 percentage points**.\n\nA second survey asks **${n2}** people — ${mult} times as many — using the same method.\n\nWhat is the second survey's margin of error, in percentage points?`,
      answer: numeric(round(4 / improvement, 2), { tolerance: 0.05 }),
      hints: [
        'Precision does not improve in proportion to the sample. It improves with the SQUARE ROOT of it.',
        `${mult} times the people means √${mult} = ${improvement} times the precision.`,
        `4.0 ÷ ${improvement} = **±${round(4 / improvement, 2)} points**.`,
      ],
      explanation: `Margin of error shrinks with the square root of the sample size, so ${mult}× the people gives √${mult} = ${improvement}× the precision: 4.0 ÷ ${improvement} = **±${round(4 / improvement, 2)} points**.\n\nThis is why huge surveys are not as much better as they look — going from ${n1} to ${n2} people costs ${mult} times as much and buys only ${improvement} times the precision. It is also why a badly-chosen sample cannot be rescued by size: the square-root rule shrinks random error, and bias is not random error.`,
      commonErrors: {
        concept: `Expecting the margin to fall by a factor of ${mult}. Precision follows the square root, which is why the returns diminish so fast.`,
      },
    }
  },
)

/** Reading a claim against the study that supposedly supports it. */
const claimVsStudy = tpl(
  { id: 'advs-claim-gap', name: 'Claim versus study', skillIds: ['s-sources'], bucket: 'science', difficulty: 5, variants: 4, minutes: 3.5, transfer: true, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        headline: '"Chocolate improves memory, scientists find."',
        study: 'The study gave 18 adults a cocoa drink and tested word recall 90 minutes later. Recall rose slightly. There was no comparison group.',
        correct: 'With no comparison group, nothing rules out practice, time of day, or ordinary variation',
        wrong: [
          'The sample of only 18 people is much too small for the finding to mean anything',
          'Ninety minutes is far too short a window for any memory effect to show up in',
          'The finding is probably right, but the word "improves" is a good deal too strong here',
        ],
        why: 'The missing control is the structural flaw: without it there is no way to know what recall would have done anyway. Eighteen is small, but small samples give imprecise estimates rather than meaningless ones — and calling the effect merely overstated concedes that an effect was measured, which is exactly what the design cannot establish.',
      },
      {
        headline: '"Teenagers who use social media more are lonelier, study shows."',
        study: 'A survey of 2,000 teenagers found a correlation of 0.2 between hours of use and a loneliness score, measured on the same day.',
        correct: 'The direction is unestablished — lonelier teenagers may use more social media, not the reverse',
        wrong: [
          'A correlation of 0.2 is far too weak to be worth anybody reporting on at all',
          'Two thousand teenagers cannot possibly represent the whole teenage population',
          'Loneliness scores here are all self-reported, and self-reported numbers cannot be trusted',
        ],
        why: 'Measuring both at one moment leaves the arrow pointing either way, and the headline picks one. The correlation is genuinely weak but not nothing; 2,000 is a decent sample; and self-report is standard for something only the person can observe. Reverse causation is the flaw the headline actually commits.',
      },
      {
        headline: '"New teaching method doubles exam pass rates."',
        study: 'One school adopted the method and its pass rate went from 40% to 80% over three years. Staff also changed, and the intake became more selective.',
        correct: 'Several things changed together, so the method cannot be separated from the staff or the intake',
        wrong: [
          'Three years is much too short a period over which to judge an educational method',
          'A single school can never provide any real evidence about a teaching method',
          '"Doubles" is a misleading word here, because 40 up to 80 is only 40 percentage points',
        ],
        why: 'This is the confound: three plausible causes moved at once, and the result cannot be assigned to any of them. A single school CAN provide evidence — just weak evidence — and "doubles" is arithmetically fair for a rate going 40% to 80%, which makes it a tempting but incorrect objection.',
      },
      {
        headline: '"Study finds no link between screen time and school performance."',
        study: 'A well-designed study of 5,000 students found an effect too small to distinguish from zero, with a narrow confidence interval around it.',
        correct: 'This is meaningful evidence that any effect is small — absence of evidence is informative when the study could have detected it',
        wrong: [
          'You cannot ever prove a negative, so a study of this kind establishes nothing at all in either direction',
          'The study must have missed something somewhere, since everyone knows that screen time obviously affects schoolwork',
          'A much larger sample would be needed before any conclusion at all could reasonably be drawn from this',
        ],
        why: 'The over-correction trap. A large, well-designed study with a narrow interval around zero is real evidence of a small effect — treating every null as "proves nothing" makes you unfalsifiable in the other direction. Note what it does NOT show: that the effect is exactly zero, or that it is zero for every individual.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Does the study support the headline?',
      prompt: `**Headline:** ${c.headline}\n\n**The study:** ${c.study}\n\nWhat is the central problem — or is there one?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Write down what the study could establish at best, then compare it with what the headline says.',
        'Distinguish a STRUCTURAL flaw (no control, wrong direction, confound) from a limitation of precision. Only the first breaks the claim.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThe habit worth taking: name the single thing that would most change your reading. Scepticism that rejects everything is as useless as credulity that accepts everything, and it feels much more sophisticated — which is what makes it dangerous.`,
      transferBridge:
        'Run this on any study a headline cites: what was compared with what, who chose which group, and when were the two things measured?',
    }
  },
)

/** Turning a vague question into one that could actually come out either way. */
const designTheTest = tpl(
  { id: 'advs-design-test', name: 'Design the discriminating test', skillIds: ['s-hypo'], bucket: 'science', difficulty: 5, variants: 4, minutes: 3.5, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        setup: 'Your bike light seems to run down faster in winter. You suspect the cold.',
        q: 'Which test would actually separate cold from the alternatives?',
        correct: 'Run two identical fresh batteries, one indoors and one outdoors, for the same hours of use',
        wrong: [
          'Record how long the battery lasts in each week right through the winter',
          'Ask some other cyclists whether their lights run down faster during the winter',
          'Buy a more expensive battery and see whether the problem simply goes away on its own',
        ],
        why: 'Only the paired test holds usage constant and varies temperature alone. Weekly logging cannot separate cold from the longer dark hours you are using it for; other cyclists share the same confound; and a new battery changes two things at once.',
      },
      {
        setup: 'Two explanations for why your plant is wilting: too little water, or too little light.',
        q: 'Which observation distinguishes them best?',
        correct: 'Whether the soil is dry — wet soil rules out underwatering immediately',
        wrong: [
          'Whether the leaves are yellow, since both causes can yellow leaves',
          'How long the plant has been in that position',
          'Whether other plants nearby are also wilting',
        ],
        why: 'A discriminating test is one whose possible results point in different directions. Soil moisture does that in a single check. Yellow leaves are explicitly consistent with both, which makes the observation worthless for choosing between them however easy it is to make.',
      },
      {
        setup: 'Your phone battery drains fast. It could be a specific app, or the battery ageing.',
        q: 'What is the most efficient single test?',
        correct: 'Check the battery usage breakdown by app — an app problem shows up concentrated in one place',
        wrong: [
          'Charge the phone right up and then see how long it lasts if you do not use it at all',
          'Uninstall the app that you suspect and watch what happens for a week',
          'Compare it against a friend\'s phone of exactly the same age and model',
        ],
        why: 'The breakdown resolves it in seconds because the two hypotheses predict visibly different shapes — one app dominating, or drain spread evenly. Uninstalling for a week works but costs a week; the idle test is informative but slower and confounds background activity.',
      },
      {
        setup: 'You think the bus is late more often on rainy days.',
        q: 'What is the biggest threat to your informal impression?',
        correct: 'You are more likely to notice and remember lateness when standing in the rain',
        wrong: [
          'Rain genuinely slows traffic, so the impression is probably just correct',
          'You would need at least a year of data before saying anything',
          'Bus timetables change too often for any comparison to hold',
        ],
        why: 'The recording is inside your head, and the condition you are testing also changes how memorable the event is — so the data is generated by the hypothesis. That is why writing it down as it happens, rain or not, is worth more than a year of impressions.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Which test would settle it?',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A useful test is one whose possible results would point you in DIFFERENT directions.',
        'A test that comes out the same under both explanations teaches nothing, however easy it is to run.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThe test to choose is rarely the easiest one. It is the one whose outcomes disagree with each other under the rival explanations — and quite often it changes only one thing while holding everything else still.`,
      transferBridge:
        'The same question is the fastest way through most everyday debugging: what would I see if explanation A were true that I would NOT see if B were?',
    }
  },
)

export const ADVANCED_SCIENCE_TEMPLATES: ItemTemplate[] = [
  hiddenConfound,
  precisionCost,
  claimVsStudy,
  designTheTest,
]
