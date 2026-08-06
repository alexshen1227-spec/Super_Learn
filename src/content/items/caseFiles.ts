/**
 * Weekly Case Files — cross-domain capstones combining several trained
 * abilities on one coherent (fictional) situation. Deterministic validation
 * where possible; rubric self-check for the synthesis step.
 */
import type { ItemTemplate, RenderedItem } from '../../domain/types'

interface CaseDef {
  id: string
  name: string
  skillIds: string[]
  minutes: number
  body: Omit<RenderedItem, 'templateId' | 'version' | 'seed' | 'kind'>
}

const CASES: CaseDef[] = [
  {
    id: 'case-lunch-waste',
    name: 'Case File: The Lunchroom Numbers',
    skillIds: ['m-data', 's-corr', 'm-percent'],
    minutes: 14,
    body: {
      title: 'The Lunchroom Numbers',
      prompt:
        'The student council claims their new "Take What You\'ll Eat" posters cut food waste. You have the data. Work the case.',
      parts: [
        {
          study:
            'CAFETERIA FOOD WASTE (kg per day, same scale used all term)\n\n| Week | Posters up? | Menu | Waste |\n| --- | --- | --- | --- |\n| 1 | no | pizza week | 40 |\n| 2 | no | stew week | 60 |\n| 3 | yes | pizza week | 32 |\n| 4 | yes | stew week | 48 |',
          prompt: 'Compare the two PIZZA weeks (week 1 vs week 3). By what **percent** did waste fall? (Enter just the number.)',
          answer: { type: 'numeric', answer: 20 },
          explanation: 'Like compares with like: (40 − 32)/40 = 8/40 = 20%. Comparing week 2 (stew, 60) to week 3 (pizza, 32) would smuggle the menu change into the posters\' credit.',
        },
        {
          prompt: 'The stew weeks (2 vs 4) also fell 60 → 48. Which statement best matches ALL the data?',
          answer: {
            type: 'mcq',
            options: [
              'Waste fell ~20% within each menu type after the posters — consistent with the posters helping',
              'The posters cut waste by 28 kg (60 − 32), a huge success',
              'Menu explains everything; the posters did nothing',
              'The data shows waste is random',
            ],
            correct: 0,
          },
          explanation:
            'Within-menu comparisons (40→32, 60→48) both show ~20% drops — the honest effect estimate. The "28 kg" version cherry-picks across menus; "menu explains everything" ignores that BOTH menus improved.',
        },
        {
          prompt: 'Before declaring victory, which rival explanation most needs ruling out?',
          answer: {
            type: 'mcq',
            options: [
              'Something else changed in weeks 3–4 (portion sizes, a canteen-staff change, exam season)',
              'Students suddenly evolved smaller stomachs',
              'The scale started weighing pizza differently from stew',
              'Waste data can never mean anything',
            ],
            correct: 0,
          },
          explanation:
            'The design is before/after, not a controlled experiment — anything else that changed at the same time rides along. Asking the kitchen what ELSE changed in week 3 is the cheapest next test.',
        },
        {
          prompt:
            'Write the council a 2–3 sentence conclusion: what the data shows, how confident to be, and what check would firm it up.',
          answer: {
            type: 'draft',
            criteria: [
              'States the ~20% within-menu drop (not the cross-menu 28 kg)',
              'Confidence is hedged: consistent with, not proven',
              'Names a concrete follow-up (ask what else changed / posters down for a week / compare with another school)',
            ],
            model:
              'Model: "Comparing matching menus, waste fell about 20% after the posters went up (pizza 40→32 kg, stew 60→48 kg). That is consistent with the posters helping, but the design can\'t rule out other week 3–4 changes. Suggest: confirm nothing else changed with the kitchen, or take posters down for one week — if waste rebounds, the case is strong."',
          },
          explanation:
            'A good conclusion is sized to its evidence: effect stated within like-for-like comparisons, confidence hedged, and a falsifying follow-up named. The posters-down week is a reversal test — the strongest cheap design available here. Nothing here is scored — the next part is.',
        },
        {
          stage: 'Peer review',
          prompt:
            'Now the graded part. Four councils submitted conclusions from the same table. Which one is **both** numerically honest **and** correctly hedged?',
          answer: {
            type: 'mcq',
            options: [
              'Waste fell about 20% within each menu after the posters went up — consistent with the posters helping, though other week 3–4 changes are not ruled out.',
              'Waste fell about 20% within each menu after the posters went up, proving the posters caused the drop.',
              'Waste fell 28 kg after the posters went up, a clear success for the campaign.',
              'The menus differ between weeks, so this data cannot say anything about the posters.',
            ],
            correct: 0,
          },
          explanation:
            'Two distinct failures are on offer. "Proving" has the right number with the wrong confidence — a before/after design cannot establish cause. "28 kg" is the cross-menu cherry-pick (stew 60 vs pizza 32), which quietly credits the posters with the menu change. The last option over-corrects: the matched pairs exist precisely so the menu can be held constant, so the data is not silent. Only the first sizes the claim to the design.',
        },
      ],
      hints: [
        'Keep menu constant when comparing — the data was collected in matched pairs for a reason.',
        'Percent change = change ÷ original.',
        'Before/after designs always carry a "what else changed?" debt.',
      ],
      explanation:
        'Full case: within-menu drops of 20% in both pairs support (not prove) the posters. The transferable skeleton: match comparisons, compute honest percents, hunt confounds, and propose the test that could still kill your conclusion.',
    },
  },
  {
    id: 'case-tournament',
    name: 'Case File: The Tournament Weekend',
    skillIds: ['st-ev', 'st-decomp', 'st-premortem'],
    minutes: 14,
    body: {
      title: 'The Tournament Weekend',
      prompt:
        'Saturday chess tournament, five rounds, and a science worksheet due Monday. Plan the weekend like a strategist.',
      parts: [
        {
          study:
            'THE CHOICE: In round 5 you can offer an early draw (guaranteed **0.5 points**) or play on in a sharp position you estimate you win **40%** of the time (win = 1 point, loss = 0).\n\nPrize cutoff: 3.5 points wins a book voucher. You have 3 points.',
          prompt: 'What is the expected value (in points) of playing on?',
          answer: { type: 'numeric', answer: 0.4, tolerance: 0.001 },
          explanation: 'EV = 0.4 × 1 + 0.6 × 0 = 0.4 points — LESS than the certain 0.5.',
        },
        {
          prompt: 'Given the 3.5-point cutoff, which reasoning is right?',
          answer: {
            type: 'mcq',
            options: [
              'Take the draw: 3 + 0.5 hits the cutoff exactly, and EV agrees (0.5 > 0.4)',
              'Play on: winners never settle',
              'Play on: 1 point is worth more than 0.5',
              'Flip a coin — the options are equivalent',
            ],
            correct: 0,
          },
          explanation:
            'Here EV and the goal align: the draw guarantees the voucher. The deeper lesson: if you had 2.5 points, the draw would MISS the cutoff and playing on (40% of the prize vs 0%) would become correct even at lower EV — targets can overrule averages. Always check both.',
        },
        {
          prompt: 'Order the weekend plan so Monday\'s worksheet is safe.',
          answer: {
            type: 'order',
            options: [
              'Friday: skim the worksheet and list what it needs (10 min)',
              'Saturday: tournament, phone silenced',
              'Sunday morning: do the worksheet while fresh',
              'Sunday evening: buffer for whatever slipped',
            ],
            correct: [0, 1, 2, 3],
          },
          explanation:
            'The Friday skim is the strategist\'s move: 10 minutes converts Sunday from "discover the task" to "execute the task", and reveals early if materials are missing. Buffer goes LAST — buffers only protect what is scheduled before them.',
        },
        {
          prompt: 'Pre-mortem the plan: it is Monday and the worksheet is NOT done. Write the two most likely causes and a repair for each.',
          answer: {
            type: 'draft',
            criteria: [
              'Two different causes, at least one boring/logistical',
              'Each cause has a repair that changes the plan NOW (not "try harder")',
              'One repair involves the Friday skim or the Sunday buffer',
            ],
            model:
              'Model: (1) Tournament exhaustion wiped out Sunday morning — repair: move the worksheet to a fixed 10 am start with a friend check-in, and protect Saturday sleep. (2) The worksheet needed the textbook left at school — repair: the Friday skim exists precisely to catch this; photograph the pages Friday. (3) Sunday plans appeared — repair: the evening buffer absorbs one surprise; two means the Friday skim becomes Friday DO.',
          },
          explanation:
            'Plans fail on logistics more than on willpower. The Friday skim de-risks the whole weekend for 10 minutes — highest leverage-per-minute in the plan. Nothing here is scored — the next part is.',
        },
        {
          stage: 'Repair test',
          prompt:
            'Now the graded part. Select every response below that is a **real repair** — one that changes a condition in the weekend plan, rather than restating the intention.',
          answer: {
            type: 'multi',
            options: [
              'Photograph the worksheet pages on Friday so the textbook staying at school cannot block Sunday.',
              'Set the worksheet for a fixed 10 am Sunday start rather than "Sunday morning".',
              'Decide to be disciplined about Sunday regardless of how Saturday goes.',
              'Keep Sunday evening free as a buffer for exactly one surprise.',
              'Remember that the worksheet matters for the science grade.',
              'Promise yourself an early night on Saturday if the tournament runs long.',
            ],
            correct: [0, 1, 3],
          },
          explanation:
            'A repair changes something you could point at on Friday: a photograph exists, a time is fixed, an evening is reserved. "Be disciplined", "remember it matters", and a promise contingent on how the day goes all leave every failure condition untouched — which is why the same weekend fails the same way twice.',
        },
      ],
      hints: [
        'EV = probability × payoff, summed over outcomes.',
        'Check EV AND the goal cutoff — they can disagree.',
        'Backward-plan from Monday: what must be true Sunday night?',
      ],
      explanation:
        'The case in one line: compute the numbers, but let the GOAL structure the decision; then armor the plan where plans actually break — at logistics and energy, not motivation.',
    },
  },
  {
    id: 'case-rumor',
    name: 'Case File: The Rumor Network',
    skillIds: ['h-influence', 'i-bayes', 's-sources'],
    minutes: 12,
    body: {
      title: 'The Rumor Network',
      prompt:
        'A rumor says the school is canceling the spring trip. It is spreading fast. Investigate before you amplify.',
      parts: [
        {
          study:
            'WHAT YOU HAVE:\n1. A screenshot of a group-chat message: "my cousin works in the office, trip is CANCELED"\n2. The school\'s calendar page, still listing the trip\n3. A reply: "share this before they delete everything!!"\n4. Your friend\'s memory: "someone said the buses fell through"',
          prompt: 'Label each element: **Claim**, **Evidence**, or **Pressure tactic**.',
          answer: {
            type: 'classify',
            categories: ['Claim', 'Evidence', 'Pressure tactic'],
            statements: [
              { text: '"my cousin works in the office, trip is CANCELED"', category: 0 },
              { text: 'The calendar page still listing the trip', category: 1 },
              { text: '"share this before they delete everything!!"', category: 2 },
              { text: '"someone said the buses fell through"', category: 0 },
            ],
          },
          explanation:
            'Two unsourced claims, one piece of checkable evidence (which currently points AGAINST the rumor), and one urgency-push whose whole job is to make you forward before thinking. "Share before they delete" is the influence fingerprint — truth survives a delay.',
        },
        {
          prompt: 'What is the best next test?',
          answer: {
            type: 'mcq',
            options: [
              'Ask the trip\'s teacher-organizer directly, or wait for an official notice',
              'Forward it to more people asking "is this true??"',
              'Count how many people are sharing it',
              'Screenshot it to a bigger group for visibility',
            ],
            correct: 0,
          },
          explanation:
            'The organizer is the primary source — one message settles what a thousand shares cannot. Share-counts measure spread, not truth; forwarding "just asking" IS spreading.',
        },
        {
          study:
            'CALIBRATION DATA (from your own experience, roughly): of the last 20 dramatic school rumors, about 4 turned out true. Suppose when a rumor IS true, a calendar page lags behind (stays unchanged) half the time; when a rumor is FALSE, the calendar is unchanged essentially always.',
          prompt:
            'Out of 20 rumors like this one: how many are TRUE-with-unchanged-calendar? (true rumors × ½)',
          answer: { type: 'numeric', answer: 2 },
          explanation: '4 true rumors × ½ = 2 true rumors would still show an unchanged calendar.',
        },
        {
          prompt: 'And 16 rumors are false, essentially all with unchanged calendars. Given the unchanged calendar you observed, about what fraction of such rumors are true?',
          answer: { type: 'mcq', options: ['About 2 in 18 (~11%)', 'About half', 'About 4 in 20 (20%)', 'Certainly false'], correct: 0 },
          explanation:
            'Count the worlds consistent with your observation: 2 true + 16 false = 18 rumor-worlds with an unchanged calendar; 2/18 ≈ 11% true. The unchanged calendar SHOULD lower your belief below the 20% base rate — evidence that fits "false" better than "true" must move you, just not to zero.',
        },
        {
          prompt: 'Your group chat is waiting. What do you post?',
          answer: {
            type: 'mcq',
            options: [
              '"Calendar still shows the trip; I\'ve asked Ms. Ray. Hold off sharing till she answers."',
              'Nothing — quietly let it spread, it\'s not your job',
              'The screenshot with "probably fake lol" (still forwarding it)',
              '"CONFIRMED FALSE" (you haven\'t confirmed anything)',
            ],
            correct: 0,
          },
          explanation:
            'The good post shares your EVIDENCE and your TEST, not a verdict you don\'t own — and it interrupts the urgency loop without attacking anyone. Overclaiming "confirmed false" spends credibility you may need when you\'re right.',
        },
      ],
      hints: [
        'Sort claim / evidence / pressure before evaluating anything.',
        'Primary sources outrank crowd volume.',
        'Natural frequencies: count the worlds, then divide.',
      ],
      explanation:
        'One case, three disciplines: influence-defense named the urgency tactic, source-thinking found the primary source, and base-rate counting sized your belief (~11%). The endgame is a post that spreads your METHOD instead of the rumor.',
    },
  },
]

export const CASEFILE_TEMPLATES: ItemTemplate[] = CASES.map((c) => ({
  id: c.id,
  version: 1,
  kind: 'multi',
  name: c.name,
  skillIds: c.skillIds,
  bucket: c.skillIds[0].startsWith('st') ? 'strategist' : c.skillIds[0].startsWith('h') ? 'insight' : 'science',
  difficulty: 4,
  variants: 1,
  minutes: c.minutes,
  transfer: true,
  authentic: {
    format: 'fieldwork',
    deliverable: 'an evidence-backed case recommendation',
    simulationNote: 'The situation and records are fictional, but the evidence limits and decision constraints are realistic.',
  },
  provenance: 'Original fictional case composed for Axiom Lab; deterministic parts solved during authoring.',
  generate: (seed: number): RenderedItem => ({
    templateId: c.id,
    version: 1,
    seed,
    kind: 'multi',
    ...c.body,
  }),
}))
