/**
 * Case comparison — the transfer mechanism with the best evidence behind it.
 *
 * Gentner, Loewenstein & Thompson (2003, J. Educational Psychology 95(2)):
 * learners who read TWO surface-different cases sharing a deep structure and
 * were asked to describe what they had in common transferred the principle to
 * a new case 2-3x more often than learners who studied the SAME two cases one
 * at a time (.59 vs .22, .38 vs .16). The control holds the content identical
 * and varies only the instruction, which is the design quality the chess and
 * brain-training literatures lack. A third experiment found guided comparison
 * beat a bare "compare these" 90% to 70%, and schema quality predicted
 * transfer — so the written comparison is PROMPTED, and the graded checkpoint
 * that follows tests the principle on a third case rather than on the two just
 * read. Ross (1984) is the problem being solved: over 80% of spontaneous
 * remindings are driven by surface similarity, so a relevant principle the
 * learner already knows stays inert.
 *
 * Shape of every item here, and the reason for it:
 *   1. Compare  — both cases, then an UNGRADED written comparison. Never
 *                 scored; the app cannot read prose, and pretending to would
 *                 be worse than admitting it.
 *   2. Principle — graded. Distractors are surface summaries and near-miss
 *                 principles, deliberately similar in length to the key so the
 *                 answer cannot be picked by its shape.
 *   3. New case — graded, and a THIRD cover story. This is the transfer test,
 *                 which is why these templates carry `transfer: true`.
 *
 * What is NOT claimed: that this makes anyone a better thinker in general.
 * "Far transfer" in the source study means a structurally similar new case,
 * students, and delays of up to a week. See docs/RESEARCH.md §40.
 */
import type { ItemPart, ItemTemplate } from '../../domain/types'
import { cycle, draft, mcq, tpl } from '../lib'
import type { Rng } from '../../engine/rng'

function part(stage: string, body: Omit<ItemPart, 'stage'>): ItemPart {
  return { stage, ...body }
}

interface CaseSet {
  /** Short label for the shared structure, used in the explanation. */
  principle: string
  a: { title: string; text: string }
  b: { title: string; text: string }
  /** What a good written comparison contains. Guides, never grades. */
  criteria: string[]
  model: string
  /** The graded principle question. */
  key: string
  decoys: string[]
  /** A third cover story, surface-different from both. */
  transfer: { text: string; key: string; decoys: string[] }
  why: string
}

/**
 * Build the three-checkpoint item. Shared by every template in this file so
 * the structure cannot drift between topics.
 */
function comparisonItem(rng: Rng, set: CaseSet) {
  return {
    title: 'Two cases',
    prompt: 'Two situations that look nothing alike. Read both, then find what they have in common.',
    explanation: `${set.principle}. ${set.why}`,
    hints: [
      'Cross out every name, place and subject. Describe what is left.',
      'Ask what each side wanted, and whether they wanted the same things equally.',
      'The principle is whatever makes the same move work in BOTH cases.',
    ],
    parts: [
      part('Compare', {
        study: `CASE 1 — ${set.a.title}\n\n${set.a.text}\n\n---\n\nCASE 2 — ${set.b.title}\n\n${set.b.text}`,
        studySeconds: 90,
        prompt:
          'In your own words: what is the same about how these two situations WORK? Ignore the surface — the people, the setting, the subject. Describe the shared structure and what it means for what should be done.',
        answer: draft({
          criteria: set.criteria,
          model: set.model,
          minWords: 25,
          placeholder: 'The thing both have in common is…',
        }),
        explanation:
          'This part is never scored — the app cannot read writing, and marking it would be pretending. Writing the comparison is what does the work: in the study this method comes from, learners who wrote out the shared structure transferred it to a new case two to three times as often as learners who read the same two cases separately.',
        hints: [
          'Strip out the names and the setting. What is left?',
          'What did each side actually want, and did they want the same things equally?',
          'What made the resolution possible in BOTH cases, rather than in one of them?',
        ],
      }),
      part('Principle', {
        prompt: 'Which statement names the structure the two cases share?',
        answer: mcq(rng, set.key, set.decoys),
        explanation: `${set.principle}. ${set.why}`,
      }),
      part('New case', {
        prompt: `A third situation, unrelated to either of the first two:\n\n${set.transfer.text}\n\nWhat does the shared principle say to do here?`,
        answer: mcq(rng, set.transfer.key, set.transfer.decoys),
        explanation:
          'This is the point of the exercise. Recognising the structure in a case that shares none of the surface details is the thing that was actually learned; getting the first two right only shows they were read.',
      }),
    ],
  }
}

// ---------------------------------------------------------------- trade-offs

const TRADE_SETS: CaseSet[] = [
  {
    principle: 'Unequal priorities make a trade possible',
    a: {
      title: 'Two flatmates and the chores',
      text: 'Priya and Dan split six weekly chores. Priya loathes washing up and does not mind vacuuming; Dan finds vacuuming exhausting and washes up while listening to music. They have been alternating every chore week by week, and both weeks feel bad to somebody.',
    },
    b: {
      title: 'Two clubs and one room',
      text: 'The debate club and the film club share a room. Debate needs it quiet and needs the whiteboard; film needs the projector and does not care about noise. They have been splitting each Tuesday down the middle, and neither gets a usable session.',
    },
    criteria: [
      'Say what each side wanted, and that they did NOT want the same things equally',
      'Say what the current arrangement does to every issue (splits it)',
      'Say what could be done instead, and why it leaves both better off',
    ],
    model:
      'In both cases there are several separate issues, and the two sides care about them by different amounts. Splitting every issue down the middle gives each side half of something they care about and half of something they do not, which wastes the difference. Because their priorities are unequal, each side can take the whole of what it cares about most and give away the whole of what it cares about least — and both end up better off than under the even split, without anyone giving up more in total.',
    key: 'Each side cares about the issues by different amounts, so trading whole issues beats splitting each one',
    decoys: [
      'Both sides want the same thing, so the only fair answer is to divide everything evenly',
      'One side is being unreasonable, so a neutral person should decide the split for them',
      'The issues are too tangled to separate, so the sides should take turns getting priority',
      'Each side should give up the thing it wants most, since that is what compromise means',
    ],
    transfer: {
      text: 'A band has two songwriters. One cares enormously about the lyrics and shrugs at the artwork; the other has strong feelings about the artwork and none about lyrics. Right now they co-approve every decision, and each album takes months of argument.',
      key: 'Give each one final say over the thing they care about most, and none over the other',
      decoys: [
        'Keep co-approving everything but set a strict time limit on each argument',
        'Alternate: one of them decides everything on this album, the other on the next',
        'Bring in the drummer as a third vote to break every tie that comes up',
        'Split each decision in half so both feel equally heard about lyrics and artwork',
      ],
    },
    why: 'The trap is hearing "fair" as "equal on every issue". Equal-on-every-issue throws away the one thing that makes both sides better off: that they disagree about what matters.',
  },
  {
    principle: 'Unequal priorities make a trade possible',
    a: {
      title: 'The shared car',
      text: 'Two siblings share a car. One needs it on weekday mornings and never at weekends; the other only wants it on Saturday nights. They currently run a strict alternating-day rota, so each of them regularly has the car on a day they do not need it and lacks it on a day they do.',
    },
    b: {
      title: 'Two teams, one budget',
      text: 'A school gives two teams one combined budget. The robotics team desperately needs equipment and can travel cheaply; the choir needs travel money and already owns its equipment. The office has been splitting every budget line 50/50 between them.',
    },
    criteria: [
      'Name the separate issues in each case',
      'Say how strongly each side cares about each issue, and note the mismatch',
      'Explain why an even split on every line wastes something',
    ],
    model:
      'Both cases have two or more distinct resources and two sides whose need for each resource is lopsided. Because the intensity is lopsided, the even split hands each side something it does not need while starving it of what it does. Reallocating whole categories — not halves of every category — leaves both sides better off using exactly the same total resource.',
    key: 'The resources are wanted unevenly, so allocating whole categories beats halving every one',
    decoys: [
      'Both sides need the same things, so the only defensible rule is an even split',
      'The side with the greater need should simply receive the larger total share',
      'Because the total is fixed, any gain for one side has to be a loss for the other',
      'Rotating who gets priority is fairer than letting either side specialise at all',
    ],
    transfer: {
      text: 'Two housemates are dividing a grocery order. One is fussy about coffee and indifferent to bread; the other buys expensive bread and drinks whatever coffee is there. They currently buy the mid-range version of everything.',
      key: 'Buy the good coffee and the cheap bread, or the reverse, rather than mid-range on both',
      decoys: [
        'Keep buying mid-range on both, since that is the fairest possible outcome',
        'Let whoever spends more money that month choose both items outright',
        'Buy the expensive version of both and split the higher bill evenly',
        'Alternate weeks, so each housemate gets their preferred item every other week',
      ],
    },
    why: 'Mid-range on everything is the even split in disguise. It spends the same money and satisfies nobody, precisely because the two people care unequally.',
  },
]

const tradeComparison = tpl(
  {
    id: 'cc-tradeoff',
    name: 'Two cases: trading what you do not want',
    skillIds: ['x-compare', 'st-tradeoff'],
    bucket: 'meta',
    difficulty: 3,
    variants: TRADE_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, TRADE_SETS)),
)

// --------------------------------------------------------- selection effects

const SELECTION_SETS: CaseSet[] = [
  {
    principle: 'The sample you can see was filtered before you saw it',
    a: {
      title: 'The advice thread',
      text: 'A forum thread asks people who dropped out of school to run a business whether it worked out. Almost every reply says it was the best decision they ever made. A reader concludes that dropping out to start a business usually works.',
    },
    b: {
      title: 'The five-star app',
      text: 'A habit-tracking app has an average rating of 4.8 from 900 reviews. Its own figures show that most people who install it stop opening it within eleven days. A reader concludes that the app works well for almost everyone.',
    },
    criteria: [
      'Say who is missing from each group of responses, and why they are missing',
      'Say what the filter is — what had to happen for someone to appear in the data',
      'Say what you would need in order to answer the original question honestly',
    ],
    model:
      'In both cases the data was filtered before anyone read it, and the filter is related to the outcome being asked about. People whose business failed are less likely to still be in the entrepreneurs forum answering questions; people who abandoned the app are less likely to review it. So the visible group is not a sample of everyone who tried — it is a sample of everyone who tried AND stayed, which is exactly the group that would look successful whether or not the thing works. Answering the real question needs the people who left.',
    key: 'Whether someone appears in the data depends on the outcome, so the visible group is not everyone who tried',
    decoys: [
      'The samples are too small, so gathering several thousand more responses would settle it',
      'The respondents are lying about their outcomes to look better in front of strangers',
      'Averages hide variation, so the median rather than the mean should have been reported',
      'The two groups were asked different questions, so their answers cannot be compared at all',
    ],
    transfer: {
      text: 'A coach points out that every athlete currently on the national team trained twice a day from the age of nine, and concludes that training twice a day from nine is what gets you onto the team.',
      key: 'Find the children who also trained twice a day from nine and did not make the team',
      decoys: [
        'Survey more current team members to confirm the twice-a-day figure is accurate',
        'Ask the athletes whether they personally believe the early training was decisive',
        'Compare the team against athletes in a different sport with different training',
        'Check whether the athletes started at exactly nine rather than at eight or ten',
      ],
    },
    why: 'The question is never "what do the survivors have in common" — plenty of non-survivors have it too. The missing group is where the answer lives.',
  },
  {
    principle: 'The sample you can see was filtered before you saw it',
    a: {
      title: 'The safe crossing',
      text: 'A council reviews injury reports for a road crossing and finds very few involving elderly pedestrians. It concludes the crossing is safe for elderly people. Local residents mention that elderly people avoid that crossing and walk to the footbridge instead.',
    },
    b: {
      title: 'The tough marker',
      text: 'A teacher notices that students who choose her optional advanced module get high marks in it, and concludes the module raises attainment. Students say the module has a reputation for being hard, and only confident students sign up.',
    },
    criteria: [
      'Identify the filter operating in each case, and say what it selects on',
      'Explain why the observed pattern would appear even if the claim were false',
      'Say what comparison would actually test the claim',
    ],
    model:
      'Both conclusions read a filtered group as if it were a random one. The crossing sees few elderly injuries partly because few elderly people use it — the exposure, not the safety, is what changed. The module has high marks partly because the students who enrol were already doing well. In both cases the pattern would appear exactly as observed even if the crossing were dangerous and the module useless, which means the pattern cannot distinguish between those possibilities.',
    key: 'The group was selected on something linked to the outcome, so the pattern appears either way',
    decoys: [
      'The numbers are too small to be reliable and need several more years of data',
      'The people reporting the data have an incentive to make their own work look good',
      'Correlation was mistaken for causation because no experiment was ever conducted',
      'The two measures used different definitions, so the comparison was never valid',
    ],
    transfer: {
      text: 'A hospital reports that patients who received a new physiotherapy programme recovered faster than those who did not. Referral to the programme was made by physiotherapists, who chose patients they judged likely to benefit.',
      key: 'The referral itself selected likely-to-recover patients, so the comparison is not fair',
      decoys: [
        'The recovery measure was probably subjective and should have been timed instead',
        'The sample of referred patients is too small to support a firm conclusion',
        'Patients knew they were receiving a new programme and tried harder because of it',
        'Physiotherapists may have recorded the outcomes of their own patients generously',
      ],
    },
    why: 'A filter that selects on the outcome makes the data agree with the claim whether or not the claim is true, which is what makes it worse than a small sample rather than a version of one.',
  },
]

const selectionComparison = tpl(
  {
    id: 'cc-selection',
    name: 'Two cases: who is missing from the data',
    skillIds: ['x-compare', 'o-selection'],
    bucket: 'meta',
    difficulty: 4,
    variants: SELECTION_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, SELECTION_SETS)),
)

// ---------------------------------------------------------- the outside view

const OUTSIDE_SETS: CaseSet[] = [
  {
    principle: 'Start from what similar cases actually did, then adjust',
    a: {
      title: 'The essay estimate',
      text: 'Sam plans an essay: two hours reading, one drafting, one editing — four hours, done Sunday. Sam has written eleven essays this year. Every one of them took between seven and eleven hours. Sam has never once finished in four.',
    },
    b: {
      title: 'The build estimate',
      text: 'A council estimates a new footbridge at fourteen months by adding up the stages: design, tender, build, inspect. The last six comparable footbridges in the region took between twenty and thirty-one months each.',
    },
    criteria: [
      'Say what each estimate was built from',
      'Say what information was available and went unused',
      'Say what the estimate should have started from instead, and what adjusting means',
    ],
    model:
      'Both estimates were built from the inside: listing the steps of this particular job and adding up how long each should take. Both had a record of very similar jobs sitting right there, and both ignored it. Adding up steps systematically misses everything that is not a step — the interruptions, the rework, the waiting. Starting from the distribution of what similar cases actually took, and then adjusting for the few genuine differences in this one, uses the missing information instead of re-deriving it.',
    key: 'Both built the estimate from this job’s steps while ignoring how long similar jobs really took',
    decoys: [
      'Both were too optimistic because the people involved wanted the answer to be small',
      'Both broke the work into stages that were too coarse to be estimated accurately',
      'Both failed to add a safety margin on top of the figure they had already produced',
      'Both should have asked a more experienced person to check the numbers first',
    ],
    transfer: {
      text: 'A student group is budgeting its first fundraiser. They list the expected costs, add them up, and get £180. They have the accounts from the last four fundraisers run by the same society, which cost between £260 and £410.',
      key: 'Start from the £260-£410 range and adjust only for real differences in this event',
      decoys: [
        'Add a fixed 20% contingency on top of the £180 they calculated from the costs',
        'Re-check the itemised list carefully to find the costs that were left out',
        'Ask the society treasurer whether £180 sounds about right for an event',
        'Budget £180 and raise more money later if the event turns out to cost more',
      ],
    },
    why: 'Adding a margin still starts from the inside number. The record of similar cases already contains the surprises, which is why it beats a carefully itemised list.',
  },
]

const outsideComparison = tpl(
  {
    id: 'cc-outside-view',
    name: 'Two cases: the record beats the reasoning',
    skillIds: ['x-compare', 'i-refclass'],
    bucket: 'meta',
    difficulty: 3,
    variants: OUTSIDE_SETS.length,
    minutes: 7,
    kind: 'multi',
    transfer: true,
  },
  (rng, seed) => comparisonItem(rng, cycle(seed, OUTSIDE_SETS)),
)

export const CASE_COMPARISON_TEMPLATES: ItemTemplate[] = [
  tradeComparison,
  selectionComparison,
  outsideComparison,
]
