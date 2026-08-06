/**
 * Meta Lab — learning how to learn, calibration, explanation, focus.
 * These items cite the evidence tier honestly: study-technique content is
 * EVIDENCE-backed (see docs/RESEARCH.md); specific routines are heuristics.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, tpl } from '../lib'

const studyChoice = tpl(
  { id: 'x-study-choice', name: 'Pick the technique that works', skillIds: ['x-learn'], bucket: 'meta', difficulty: 2, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        s: 'Vocabulary test in 7 days, 40 terms. One hour available total.',
        correct: 'Self-testing with flashcards in 3 short sessions spread across the week',
        wrong: [
          'Rereading the list for one full hour tonight',
          'Recopying the definitions in neat handwriting tonight',
          'Highlighting the textbook chapter in three colors',
        ],
        note: 'Retrieval (testing yourself) + spacing are the two highest-utility techniques in the literature; rereading, recopying, and highlighting feel productive because they are FLUENT, not because they build recall.',
      },
      {
        s: 'You just read a chapter on plate tectonics and it "made sense". Test in 3 days.',
        correct: 'Close the book and write everything you remember, then check what you missed',
        wrong: [
          'Read the chapter twice more until it feels very familiar',
          'Watch a video of the same content for variety',
          'Copy the chapter summary into your notes',
        ],
        note: '"Made sense" is comprehension; the test demands RETRIEVAL. A closed-book brain dump both practices retrieval and diagnoses gaps — familiarity from rereading is the classic illusion of knowing.',
      },
      {
        s: 'Math: you can solve quadratic problems right after the lesson, but bomb them on mixed tests.',
        correct: 'Practice with problem types shuffled together, so choosing the method is part of the work',
        wrong: [
          'Drill 30 more quadratics in a row tonight',
          'Re-watch the quadratics lesson',
          'Memorize the worked examples word for word',
        ],
        note: 'Blocked practice hides the hardest step: RECOGNIZING which method a problem needs. Interleaving trains exactly that discrimination — its benefit shows up on mixed tests because mixed tests are what it rehearses.',
      },
      {
        s: 'Big biology exam in 3 weeks. You have 6 hours of study to distribute.',
        correct: 'Six 1-hour sessions spread over the 3 weeks, each ending with self-quizzing',
        wrong: [
          'One 6-hour session the day before, while it\'s all fresh',
          'Six hours of rereading in week 1, then rest',
          'Save all 6 hours for whenever motivation peaks',
        ],
        note: 'Spacing beats massing at every delay tested; the crammed version can even WIN a next-morning quiz while losing badly a week later — the exam date decides, and it is 3 weeks out.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Choose like the evidence chooses',
      prompt: `${c.s}\n\nWhich plan should win?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Two questions: does the plan force RETRIEVAL, and does it SPACE the practice?',
        'Distrust techniques whose main output is a feeling of smoothness.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} (Evidence tier: these rankings come from the Dunlosky et al. 2013 review and the IES practice guide — see the research ledger in Settings → About.)`,
    }
  },
)

const illusionKnowing = tpl(
  { id: 'x-illusion', name: 'Illusions of knowing', skillIds: ['x-calib', 'x-learn'], bucket: 'meta', difficulty: 3, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        s: 'After watching a tutorial, the solution steps look completely obvious. What does this feeling actually tell you?',
        correct: 'That the EXPLANATION was clear — not that you can produce the steps yourself',
        wrong: [
          'That you have mastered the skill',
          'That the problem type is easy',
          'That no practice is needed for this topic',
        ],
        note: 'Watching fluent performance creates fluent WATCHING. The test is production: close the video and do one from scratch.',
      },
      {
        s: 'You reread your notes and everything is familiar. The exam feels safe. What is the trap?',
        correct: 'Familiarity ("I\'ve seen this") is not recall ("I can generate this") — exams demand the second',
        wrong: [
          'Notes are always too shallow to study from',
          'Feeling safe causes exam anxiety later',
          'Rereading damages memory',
        ],
        note: 'Recognition and recall are different memory operations. Rereading strengthens recognition, which is nearly useless for a blank answer line — self-testing measures (and builds) the one you need.',
      },
      {
        s: 'A classmate says: "I understood it in class, so I lost points because the test questions were weird." What is the more likely story?',
        correct: 'Classroom understanding was real but FRAGILE — it never got tested against new-looking problems',
        wrong: [
          'The test was definitely unfair',
          'Understanding in class transfers automatically; something else went wrong',
          'They should have felt more confident during the test',
        ],
        note: '"Weird questions" usually means TRANSFER questions — same idea, new surface. The fix is practicing on varied, unfamiliar-looking problems before the exam does it to you.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Feelings about knowing vs knowing',
      prompt: c.s,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Separate the two channels: how learning FEELS vs what you can PRODUCE cold.',
        'The only trustworthy check is generation without the source open.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} This is why the app asks you to attempt before it explains, and why confidence ratings get compared with your actual results.`,
    }
  },
)

const errorDiagnose = tpl(
  { id: 'x-error-diagnose', name: 'Diagnose the error', skillIds: ['x-focus', 'x-calib'], bucket: 'meta', difficulty: 3, variants: 3, minutes: 3, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        s: 'Problem: "A shirt costs $40 after a 20% discount. Find the original price."\nA student computes 40 × 1.20 = $48 and is marked wrong (answer: $50). They knew percent multiplication perfectly.',
        correct: 'Wrong strategy: they added 20% of the SALE price instead of undoing a 20% cut of the ORIGINAL',
        wrong: [
          'Arithmetic slip: 40 × 1.2 is not 48',
          'Concept gap: they don\'t understand percentages at all',
          'Misread: the problem never mentioned a discount',
        ],
        note: 'The arithmetic was flawless (40 × 1.2 = 48 ✓) — the MODEL was wrong: sale = 0.8 × original, so original = 40/0.8 = 50. Drilling more percent arithmetic would fix nothing; the repair is representational.',
      },
      {
        s: 'A student solves 5 equations. Four are perfect; in one they wrote 3x = 12 → x = 9. Which diagnosis fits?',
        correct: 'Execution slip (likely 12 − 3): isolated, inconsistent with their four correct solutions',
        wrong: [
          'Concept gap in solving equations',
          'They cannot divide',
          'The whole topic needs re-teaching',
        ],
        note: 'One inconsistent error among successes is a slip, not a gap. The remedy is a checking habit (substitute the answer back), not re-instruction — different causes need different medicine.',
      },
      {
        s: 'On the physics quiz a student used the DISTANCE formula on a question asking for average SPEED, though they can recite both formulas.',
        correct: 'Misread/strategy-selection: they answered the question they expected, not the one asked',
        wrong: [
          'They do not know the formulas',
          'Random careless mistake with no pattern',
          'The question was impossible',
        ],
        note: 'Knowing formulas ≠ selecting them under pressure. The repair is a reading ritual: underline the asked-for quantity BEFORE choosing any formula. Tagging the cause correctly is what makes the fix cheap.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Same wrong answer, different diseases',
      prompt: `${c.s}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Look at the pattern ACROSS their work: consistent failures = concept; isolated ones = slip.',
        'Check whether the mechanics were right inside a wrong plan — that separates strategy errors from execution errors.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note} This is exactly how the Error Clinic files your own misses: by CAUSE, because the cause picks the cure.`,
    }
  },
)

const compression = tpl(
  { id: 'x-compression', name: 'Learning Compression', skillIds: ['x-explain'], bucket: 'meta', difficulty: 3, variants: 3, minutes: 4 },
  (_rng, seed) => {
    const cases = [
      {
        topic: 'Compress the idea of a MEAN (average)',
        model:
          'One sentence: the mean is the value every data point would have if the total were shared out equally. Example: test scores 70, 80, 90 → mean 80. Non-example: the mean of 1, 1, 1, 97 is 25 — which describes NO ONE (that is what outliers do to means, and why medians exist). Trap: the mean need not be a possible value (2.4 children).',
      },
      {
        topic: 'Compress the idea of a VARIABLE in algebra',
        model:
          'One sentence: a variable is a named placeholder that stands for a number you haven\'t pinned down yet — and it means the SAME number everywhere it appears in one problem. Example: in 2x + 3 = 11, x is 4 in both places. Non-example: x in one equation and x in a totally different problem need not match. Trap: reading 2x as "2 and x" (twenty-something) instead of 2 × x.',
      },
      {
        topic: 'Compress the idea of a CONTROLLED experiment',
        model:
          'One sentence: change one thing, hold everything else steady, and compare — so any difference in outcome has only one available cause. Example: same plant, soil, water; only the fertilizer differs. Non-example: comparing this year\'s grades (new teacher, new schedule, new textbook) with last year\'s and crediting the textbook. Trap: a "control group" is not a lazy group — it is the baseline that gives the comparison meaning.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'One sentence, one example, one trap',
      prompt: `${c.topic} into:\n1. **One sentence** (the idea, no jargon)\n2. **One example**\n3. **One non-example** (something it is NOT, that people confuse it with)\n4. **One trap** (the mistake newcomers make)\n\nWrite all four, then score yourself.`,
      answer: {
        type: 'rubric',
        criteria: [
          'My sentence states the idea without circular wording or jargon',
          'My example is concrete, with actual numbers or objects',
          'My non-example targets a real confusion, not a random wrong thing',
          'My trap describes a mistake someone would actually make',
        ],
        model: c.model,
      },
      hints: [
        'If the sentence needs the topic\'s own name to work, it is circular — say what it DOES.',
        'The non-example is the hard one: pick the nearest neighbor people confuse it with.',
        'Compare against the model after scoring.',
      ],
      explanation: `Model: ${c.model} Compression is a test disguised as note-taking: every gap in understanding becomes visible as a sentence you cannot finish. The non-example is where most learning happens — boundaries define concepts.`,
    }
  },
)

const questionQuality = tpl(
  { id: 'x-question-quality', name: 'Ask a better question', skillIds: ['x-explain', 'x-learn'], bucket: 'meta', difficulty: 2, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        s: 'You\'re stuck on a math problem and can ask the teacher ONE question. Which gets you the most?',
        correct: '"I set up 3x + 5 = 20 and got x = 5, but the book says 7 — where does my setup go wrong?"',
        wrong: [
          '"Can you just show me how to do this one?"',
          '"Is the answer 5 or 7?"',
          '"Will this be on the test?"',
        ],
        note: 'Showing your work converts the answer into a diagnosis. "Just show me" buys one solved problem; the diagnostic question buys every future problem with the same flaw. Notice its logic: the student\'s solving is fine (3x + 5 = 20 really does give x = 5), so if the book says 7, the equation itself must not match the problem — and the question aims the teacher exactly there.',
      },
      {
        s: 'Reading a science article, which self-question deepens understanding most?',
        correct: '"What would this predict that a rival explanation would NOT predict?"',
        wrong: [
          '"Is this article long?"',
          '"Do I agree with the vibe of it?"',
          '"Can I find a quote for my essay quickly?"',
        ],
        note: 'Differential predictions are where explanations earn their keep — a claim that predicts everything explains nothing.',
      },
      {
        s: 'After getting a problem RIGHT, which question adds the most future value?',
        correct: '"What feature of the problem told me which method to use?"',
        wrong: [
          '"How fast did I do it?"',
          '"Was that the last one?"',
          '"Did I get more right than my friend?"',
        ],
        note: 'Method-selection cues are the transferable residue of practice. Extracting the cue while the solve is fresh is nearly free and pays on every future problem that shares the structure.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Question quality',
      prompt: `${c.s}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Grade questions by what their ANSWER lets you do next.',
        'The best questions expose structure: where reasoning diverged, what a claim predicts, which cue picks a method.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

const focusPlan = tpl(
  { id: 'x-focus-plan', name: 'Design the deep-work block', skillIds: ['x-focus'], bucket: 'meta', difficulty: 2, variants: 2, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        s: 'You have 40 minutes for your hardest subject and a phone full of notifications. Which setup gives the 40 minutes the best chance?',
        correct: 'One named objective, phone in another room, a scrap-paper "distraction list" for stray thoughts, clean stop at 40',
        wrong: [
          'Keep the phone face-up "for the timer" and reply quickly when things come in',
          'Aim to "study as long as possible" with no defined objective',
          'Multitask two subjects to keep it interesting',
        ],
        note: 'Each element does one job: the named objective prevents drift, distance beats willpower for the phone, the capture-list parks intrusions without following them, and the defined end makes starting easier. (A routine like this HELPS focus; no timer "cures" attention struggles, and having a hard time focusing sometimes is normal, not a disorder.)',
      },
      {
        s: 'Ten minutes into homework you remember three unrelated urgent-feeling things (a reply you owe, a form, an idea). What is the focus-preserving move?',
        correct: 'Write all three on the distraction list and return to the problem — they get 10 minutes AFTER the block',
        wrong: [
          'Handle them now while they\'re fresh — each is only 2 minutes',
          'Try to hold them in memory while working',
          'Abandon the block since focus is clearly gone today',
        ],
        note: '"Only 2 minutes" each — plus the ~20 minutes of refocusing they cost. Holding them in your head taxes working memory continuously; the list externalizes them for free. Remembering things mid-focus is universal, not failure.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Focus is designed, not summoned',
      prompt: `${c.s}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Design beats discipline: change the environment, not your resolve.',
        'Interruptions cost their length PLUS the refocus time — that is the hidden price.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

const representation = tpl(
  { id: 'x-representation', name: 'Choose the representation', skillIds: ['x-explain'], bucket: 'meta', difficulty: 3, variants: 3, minutes: 2.5, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        s: 'Problem: "Ann is 4 years older than Ben. In 6 years their ages will sum to 40. Find their ages." Which representation unlocks it fastest?',
        correct: 'Symbols: Ben = x, Ann = x + 4, then (x+6) + (x+4+6) = 40',
        wrong: [
          'A realistic drawing of Ann and Ben',
          'Acting the problem out with a friend',
          'A pie chart of their ages',
        ],
        note: 'Relationship-between-unknowns problems are what algebra was built for. The equation gives 2x + 16 = 40 → x = 12: Ben 12, Ann 16. A pie chart represents parts of a whole — the wrong shape for this structure.',
      },
      {
        s: 'Problem: "A frog climbs 3 m up a 10 m well each day and slips back 2 m each night. When does it escape?" Which representation protects you from the classic wrong answer?',
        correct: 'A day-by-day number line/table — it reveals the frog ESCAPES mid-day on day 8, before the night slip',
        wrong: [
          'The formula 10 ÷ (3 − 2) = 10 days',
          'A pie chart of climb vs slip',
          'Rounding: about a week',
        ],
        note: 'The neat formula smuggles in a false assumption (that the last day includes a slip). The table shows: after day 7\'s slip the frog is at 7 m; on day 8 it climbs to 10 m and is OUT. Representations are not decorations — the right one makes the edge case visible.',
      },
      {
        s: 'You must explain to a friend why 1/3 > 1/4 though 4 > 3. Best representation?',
        correct: 'One chocolate bar cut into 3 pieces vs an identical bar cut into 4 — compare one piece from each',
        wrong: [
          'The rule "bigger denominator means smaller fraction", stated louder',
          'Decimal expansions to six places',
          'A number line from −100 to 100',
        ],
        note: 'The concrete model shows WHY: more cuts → smaller pieces. Rules without models are exactly what produces the 1/4 > 1/3 error in the first place; decimals prove the fact while explaining nothing.',
      },
    ]
    const c = cases[seed % cases.length]
    return {
      title: 'Right tool, right shape',
      prompt: `${c.s}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Match the representation to the STRUCTURE: unknown relationships → symbols; processes over time → tables/lines; part-whole → area models.',
        'A representation earns its place by making the crux (or the trap) visible.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.note}`,
    }
  },
)

export const META_TEMPLATES: ItemTemplate[] = [
  studyChoice,
  illusionKnowing,
  errorDiagnose,
  compression,
  questionQuality,
  focusPlan,
  representation,
]
