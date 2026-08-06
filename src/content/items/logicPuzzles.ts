/**
 * Logic-grid puzzles with machine-readable clues. The content audit runs the
 * brute-force solver over every puzzle to prove the solution exists, is
 * UNIQUE, and matches the stored answer.
 *
 * Clue spec reference: cat 0 = the key category; solution[c-1][k] = value
 * index in category c for key k.
 */
import type { ItemTemplate, LogicGridSpec, RenderedItem } from '../../domain/types'

interface LGDef {
  id: string
  name: string
  difficulty: 1 | 2 | 3 | 4 | 5
  minutes: number
  spec: LogicGridSpec
  lesson: string
}

const PUZZLES: LGDef[] = [
  {
    id: 'lg-detective-3',
    name: 'Three small cases',
    difficulty: 1,
    minutes: 4,
    spec: {
      categories: ['Case', 'Time solved', 'Floor'],
      values: [
        ['missing pen', 'coded note', 'moved statue'],
        ['9 am', 'noon', '3 pm'],
        ['floor 1', 'floor 2', 'floor 3'],
      ],
      clues: [
        { text: 'The coded-note case was solved at 9 am.', spec: { kind: 'is', key: 1, cat: 1, val: 0 } },
        { text: 'The moved-statue case happened on floor 1.', spec: { kind: 'is', key: 2, cat: 2, val: 0 } },
        { text: 'The missing-pen case was solved earlier than the statue case.', spec: { kind: 'order', catOrd: 1, less: { cat: 0, val: 0 }, greater: { cat: 0, val: 2 } } },
        { text: 'The 9 am case took place on floor 3.', spec: { kind: 'link', cat1: 1, val1: 0, cat2: 2, val2: 2 } },
      ],
      solution: [
        [1, 0, 2], // times: pen-noon, note-9am, statue-3pm
        [1, 2, 0], // floors: pen-2, note-3, statue-1
      ],
    },
    lesson:
      'Start from the direct facts (note = 9 am; statue = floor 1), chain the link (9 am ↔ floor 3 places the note), and let the ordering squeeze the rest: with 9 am taken, "pen earlier than statue" forces pen = noon, statue = 3 pm. Deduction is mostly bookkeeping done honestly.',
  },
  {
    id: 'lg-race-lanes',
    name: 'Lanes and snacks',
    difficulty: 2,
    minutes: 6,
    spec: {
      categories: ['Runner', 'Lane', 'Snack'],
      values: [
        ['Devi', 'Eli', 'Finn', 'Gia'],
        ['lane 1', 'lane 2', 'lane 3', 'lane 4'],
        ['apple', 'bagel', 'cereal', 'dates'],
      ],
      clues: [
        { text: 'Finn runs in lane 1.', spec: { kind: 'is', key: 2, cat: 1, val: 0 } },
        { text: 'Eli\'s lane number is higher than Gia\'s.', spec: { kind: 'order', catOrd: 1, less: { cat: 0, val: 3 }, greater: { cat: 0, val: 1 } } },
        { text: 'The bagel eater runs in lane 2.', spec: { kind: 'link', cat1: 2, val1: 1, cat2: 1, val2: 1 } },
        { text: 'Devi eats the bagel.', spec: { kind: 'is', key: 0, cat: 2, val: 1 } },
        { text: 'The dates eater runs in lane 1.', spec: { kind: 'link', cat1: 2, val1: 3, cat2: 1, val2: 0 } },
        { text: 'Gia does not eat the apple.', spec: { kind: 'not', key: 3, cat: 2, val: 0 } },
      ],
      solution: [
        [1, 3, 0, 2], // lanes: Devi-2, Eli-4, Finn-1, Gia-3
        [1, 0, 3, 2], // snacks: Devi-bagel, Eli-apple, Finn-dates, Gia-cereal
      ],
    },
    lesson:
      'The two "is" clues anchor the grid; the links convert lane facts into snack facts; the order clue (Eli > Gia) finishes the lanes once 1 and 2 are taken. Notice the negative clue only matters at the very end — negative information usually pays last.',
  },
  {
    id: 'lg-clubs-week',
    name: 'Club schedule',
    difficulty: 3,
    minutes: 7,
    spec: {
      categories: ['Club', 'Day', 'Room'],
      values: [
        ['chess', 'robotics', 'art', 'drama'],
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        ['room 101', 'room 102', 'room 103', 'room 104'],
      ],
      clues: [
        { text: 'Robotics meets on Monday.', spec: { kind: 'is', key: 1, cat: 1, val: 0 } },
        { text: 'Art meets later in the week than chess.', spec: { kind: 'order', catOrd: 1, less: { cat: 0, val: 0 }, greater: { cat: 0, val: 2 } } },
        { text: 'Drama meets earlier in the week than chess.', spec: { kind: 'order', catOrd: 1, less: { cat: 0, val: 3 }, greater: { cat: 0, val: 0 } } },
        { text: 'Room 103 hosts the Wednesday club.', spec: { kind: 'link', cat1: 1, val1: 2, cat2: 2, val2: 2 } },
        { text: 'Robotics uses room 104.', spec: { kind: 'is', key: 1, cat: 2, val: 3 } },
        { text: 'Art is not in room 102.', spec: { kind: 'not', key: 2, cat: 2, val: 1 } },
      ],
      solution: [
        [2, 0, 3, 1], // days: chess-Wed, robotics-Mon, art-Thu, drama-Tue
        [2, 3, 0, 1], // rooms: chess-103, robotics-104, art-101, drama-102
      ],
    },
    lesson:
      'The double ordering (drama < chess < art) over the three free days admits exactly one arrangement — chained inequalities are powerful exactly because each one halves the possibilities. Then the Wednesday↔103 link and one negative close the rooms.',
  },
  {
    id: 'lg-bakers',
    name: 'Bakers and ovens',
    difficulty: 3,
    minutes: 7,
    spec: {
      categories: ['Baker', 'Bread', 'Oven'],
      values: [
        ['Ivy', 'Jack', 'Kira', 'Leo'],
        ['rye', 'sourdough', 'ciabatta', 'focaccia'],
        ['oven A', 'oven B', 'oven C', 'oven D'],
      ],
      clues: [
        { text: 'Jack uses oven A.', spec: { kind: 'is', key: 1, cat: 2, val: 0 } },
        { text: 'The rye baker uses oven D.', spec: { kind: 'link', cat1: 1, val1: 0, cat2: 2, val2: 3 } },
        { text: 'Ivy does not bake the rye.', spec: { kind: 'not', key: 0, cat: 1, val: 0 } },
        { text: 'Leo bakes the ciabatta.', spec: { kind: 'is', key: 3, cat: 1, val: 2 } },
        { text: 'The sourdough comes from oven C.', spec: { kind: 'link', cat1: 1, val1: 1, cat2: 2, val2: 2 } },
        { text: 'Leo does not use oven D.', spec: { kind: 'not', key: 3, cat: 2, val: 3 } },
      ],
      solution: [
        [1, 3, 0, 2], // breads: Ivy-sourdough, Jack-focaccia, Kira-rye, Leo-ciabatta
        [2, 0, 3, 1], // ovens: Ivy-C, Jack-A, Kira-D, Leo-B
      ],
    },
    lesson:
      'The elimination chain: rye needs oven D, Jack has A, Ivy refuses rye, Leo bakes ciabatta — so rye can only be Kira\'s. Every step is a tiny "who is left?" count. When stuck, pick a value and list who could still hold it; the shortest list is your next move.',
  },
  {
    id: 'lg-hikers',
    name: 'Trails at dawn',
    difficulty: 4,
    minutes: 9,
    spec: {
      categories: ['Hiker', 'Start time', 'Trail'],
      values: [
        ['Mia', 'Noah', 'Omar', 'Pia'],
        ['7 am', '8 am', '9 am', '10 am'],
        ['3 km', '5 km', '8 km', '12 km'],
      ],
      clues: [
        { text: 'Noah starts at 7 am.', spec: { kind: 'is', key: 1, cat: 1, val: 0 } },
        { text: 'The 12 km hiker starts at 8 am.', spec: { kind: 'link', cat1: 2, val1: 3, cat2: 1, val2: 1 } },
        { text: 'Mia hikes a longer trail than Pia.', spec: { kind: 'order', catOrd: 2, less: { cat: 0, val: 3 }, greater: { cat: 0, val: 0 } } },
        { text: 'Omar starts later than Pia.', spec: { kind: 'order', catOrd: 1, less: { cat: 0, val: 3 }, greater: { cat: 0, val: 2 } } },
        { text: 'Noah hikes the 5 km trail.', spec: { kind: 'is', key: 1, cat: 2, val: 1 } },
        { text: 'Pia\'s trail is longer than Noah\'s.', spec: { kind: 'order', catOrd: 2, less: { cat: 0, val: 1 }, greater: { cat: 0, val: 3 } } },
      ],
      solution: [
        [1, 0, 3, 2], // times: Mia-8, Noah-7, Omar-10, Pia-9
        [3, 1, 0, 2], // trails: Mia-12, Noah-5, Omar-3, Pia-8
      ],
    },
    lesson:
      'Two orderings interlock: Noah\'s 5 km < Pia < Mia forces Pia = 8 km and Mia = 12 km, which drags Mia to the 8 am slot through the link. Then Pia < Omar settles the last two times. Hard grids are rarely harder logic — just longer dependency chains held steadily.',
  },
  {
    id: 'lg-library',
    name: 'Library returns',
    difficulty: 2,
    minutes: 5,
    spec: {
      categories: ['Borrower', 'Book', 'Day returned'],
      values: [
        ['Ana', 'Bruno', 'Carmen'],
        ['atlas', 'biography', 'cookbook'],
        ['Tuesday', 'Wednesday', 'Friday'],
      ],
      clues: [
        { text: 'Bruno returned his book before Ana returned hers.', spec: { kind: 'order', catOrd: 2, less: { cat: 0, val: 1 }, greater: { cat: 0, val: 0 } } },
        { text: 'The cookbook came back on Friday.', spec: { kind: 'link', cat1: 1, val1: 2, cat2: 2, val2: 2 } },
        { text: 'Carmen did not borrow the atlas.', spec: { kind: 'not', key: 2, cat: 1, val: 0 } },
        { text: 'Ana borrowed the cookbook.', spec: { kind: 'is', key: 0, cat: 1, val: 2 } },
        { text: 'The biography came back on Wednesday.', spec: { kind: 'link', cat1: 1, val1: 1, cat2: 2, val2: 1 } },
      ],
      solution: [
        [2, 0, 1], // books: Ana-cookbook, Bruno-atlas, Carmen-biography
        [2, 0, 1], // days: Ana-Friday, Bruno-Tuesday, Carmen-Wednesday
      ],
    },
    lesson:
      'Ana has the cookbook, so Ana returned on Friday. Carmen refusing the atlas gives Bruno the atlas and Carmen the biography — which the Wednesday link then pins to Wednesday, leaving Bruno Tuesday (consistent with returning before Ana). Note what the fifth clue is for: without it, Tuesday and Wednesday could swap — a puzzle is only finished when every alternative is CLOSED, not merely unlikely.',
  },
]

export const LOGIC_TEMPLATES: ItemTemplate[] = PUZZLES.map((p) => ({
  id: p.id,
  version: 1,
  kind: 'logicgrid',
  name: p.name,
  skillIds: ['z-deduce'],
  bucket: 'puzzle',
  difficulty: p.difficulty,
  variants: 1,
  minutes: p.minutes,
  provenance: 'Original puzzle composed for Axiom Lab; uniqueness proven by brute-force solver in the content audit.',
  generate: (seed: number): RenderedItem => ({
    templateId: p.id,
    version: 1,
    seed,
    kind: 'logicgrid',
    title: p.name,
    prompt:
      'Use the clues to match every item. Every row pairs exactly one value from each category, and the clues admit exactly one arrangement.',
    logicgrid: p.spec,
    hints: [
      'Direct facts first ("X is Y"), then links, then orderings, then negatives.',
      'For each unplaced value, list who could still hold it — act on the shortest list.',
      'If truly stuck: pick the most-constrained cell, try one value, and follow it to a contradiction. That is not cheating; it is proof by cases.',
    ],
    explanation: p.lesson,
    transferBridge:
      'The move you used — "process the most constrained thing first, and let eliminations cascade" — is the same engine behind scheduling, Sudoku, and debugging by elimination. Name one place you could apply it this week.',
  }),
}))
