/**
 * Advanced tier for physics and coding — the two buckets left thin by the
 * first advanced pass (3% and 9% of their questions above difficulty 3).
 *
 * Same rules as `advanced.ts`: difficulty lives in the reasoning, never in
 * obscure facts or arithmetic volume, and every answer is derived from the
 * generated values. Every code trace is SIMULATED in the generator rather than
 * hand-traced, so the key cannot disagree with the code that is printed.
 *
 * Each item targets a specific misconception that survives ordinary practice:
 * averaging speeds, reading a slope off a graph whose answer is an area,
 * expecting the bigger object to push harder, expecting more bulbs to mean
 * more resistance, and — in code — believing that copying a name copies a
 * list, or that both sides of `&&` always run.
 */
import type { ItemTemplate } from '../../domain/types'
import { cycle, mcq, numeric, round, tpl } from '../lib'

const code = (s: string) => '```\n' + s + '\n```'

// ================================================================ physics

/** Average speed is a harmonic mean, and almost nobody expects that. */
const averageSpeed = tpl(
  { id: 'adv-avg-speed', name: 'Average speed over two legs', skillIds: ['p-motion'], bucket: 'physics', difficulty: 4, variants: 16, minutes: 3, calibration: true, transfer: true },
  (_rng, seed) => {
    // Pairs chosen so the harmonic mean is exact.
    const pairs: [number, number][] = [
      [30, 60], [20, 30], [40, 60], [10, 15], [60, 30], [15, 10], [12, 24], [50, 75],
    ]
    const [v1, v2] = pairs[seed % pairs.length]
    const d = 60 * (1 + Math.floor(seed / pairs.length) % 2)
    const t1 = d / v1
    const t2 = d / v2
    const avg = (2 * d) / (t1 + t2)
    const naive = (v1 + v2) / 2
    return {
      title: 'Average speed, not average of speeds',
      prompt: `A cyclist rides **${d} km** at **${v1} km/h**, then another **${d} km** at **${v2} km/h**.\n\nWhat is the average speed for the whole trip, in km/h?`,
      answer: numeric(round(avg, 2), { tolerance: 0.05, unit: 'km/h' }),
      hints: [
        'Average speed is total distance ÷ total time. Find the two times first — they are not equal.',
        `Leg 1 takes ${d} ÷ ${v1} = ${round(t1, 2)} h; leg 2 takes ${d} ÷ ${v2} = ${round(t2, 2)} h.`,
        `${2 * d} km ÷ ${round(t1 + t2, 2)} h = **${round(avg, 2)} km/h**.`,
      ],
      explanation: `Total distance ${2 * d} km; total time ${round(t1, 2)} + ${round(t2, 2)} = ${round(t1 + t2, 2)} h. Average speed = **${round(avg, 2)} km/h**.\n\nNot ${naive} km/h. Averaging the two speeds would only be right if equal TIME were spent at each, and here equal distance is covered instead — so more of the trip is spent at the slower speed, and the answer is dragged below the midpoint. It always lands below; that is worth using as a check.`,
      commonErrors: {
        concept: `Averaging the speeds to get ${naive} km/h. Speeds can only be averaged directly when each is held for the same amount of time.`,
      },
    }
  },
)

/** On a velocity-time graph the distance is the AREA, not the slope. */
const velocityTimeArea = tpl(
  { id: 'adv-vt-area', name: 'Distance from a velocity graph', skillIds: ['p-graphs'], bucket: 'physics', difficulty: 4, variants: 18, minutes: 3 },
  (_rng, seed) => {
    const v = 8 + 2 * (seed % 5)
    const t1 = 3 + (Math.floor(seed / 5) % 3)
    const t2 = 4 + (Math.floor(seed / 15) % 3)
    const t3 = 2
    const d1 = 0.5 * v * t1
    const d2 = v * t2
    const d3 = 0.5 * v * t3
    const total = d1 + d2 + d3
    const accel = round(v / t1, 2)
    return {
      title: 'Read the whole journey',
      prompt: `A velocity–time graph shows an object that:\n\n· accelerates uniformly from rest to **${v} m/s** over **${t1} s**\n· holds **${v} m/s** for **${t2} s**\n· decelerates uniformly to rest over **${t3} s**\n\nHow far does it travel in total, in metres?`,
      answer: numeric(total, { unit: 'm' }),
      hints: [
        'On a velocity–time graph, distance is the AREA underneath — not the slope, which gives acceleration.',
        `The shape is a triangle, then a rectangle, then a triangle: ½·${v}·${t1}, ${v}·${t2}, ½·${v}·${t3}.`,
        `${d1} + ${d2} + ${d3} = **${total} m**.`,
      ],
      explanation: `Area under the graph: triangle ½ × ${v} × ${t1} = ${d1} m, rectangle ${v} × ${t2} = ${d2} m, triangle ½ × ${v} × ${t3} = ${d3} m. Total **${total} m**.\n\nThe slope of this graph is the acceleration (${accel} m/s² on the first leg), which is a different question entirely. Which quantity a graph gives you depends on what is on the axes — on a DISTANCE–time graph it is the slope that means speed, and there is no useful area at all.`,
      commonErrors: {
        representation: 'Reading the slope instead of the area, or using only the steady-speed section and ignoring both triangles.',
      },
    }
  },
)

/** Perfectly inelastic collision: momentum is conserved, kinetic energy is not. */
const inelasticCollision = tpl(
  { id: 'adv-inelastic', name: 'They stick together', skillIds: ['p-momentum'], bucket: 'physics', difficulty: 4, variants: 15, minutes: 3 },
  (_rng, seed) => {
    // Chosen so the combined velocity is exact.
    const m1 = 2 + (seed % 3)
    const m2 = m1 + 1 + (Math.floor(seed / 3) % 3)
    const total = m1 + m2
    const v1 = total * (1 + (Math.floor(seed / 9) % 2)) / m1 * 1
    const p = m1 * v1
    const vFinal = p / total
    return {
      title: 'After the collision',
      prompt: `A **${m1} kg** trolley moving at **${round(v1, 2)} m/s** collides with a stationary **${m2} kg** trolley. They lock together and move off as one.\n\nWhat is their speed immediately afterwards, in m/s?`,
      answer: numeric(round(vFinal, 2), { tolerance: 0.02, unit: 'm/s' }),
      hints: [
        'Momentum before equals momentum after. The second trolley contributes nothing before, because it is not moving.',
        `Before: ${m1} × ${round(v1, 2)} = ${round(p, 2)} kg·m/s. After, the moving mass is ${m1} + ${m2} = ${total} kg.`,
        `${round(p, 2)} ÷ ${total} = **${round(vFinal, 2)} m/s**.`,
      ],
      explanation: `Momentum before = ${m1} × ${round(v1, 2)} = ${round(p, 2)} kg·m/s, and the stationary trolley adds zero. Afterwards the same momentum is carried by ${total} kg, so the speed is ${round(p, 2)} ÷ ${total} = **${round(vFinal, 2)} m/s**.\n\nWorth noticing what is NOT conserved: kinetic energy drops from ${round(0.5 * m1 * v1 * v1, 1)} J to ${round(0.5 * total * vFinal * vFinal, 1)} J. The missing energy went into deforming, heating and sound. Momentum is conserved in every collision; kinetic energy only in elastic ones.`,
      commonErrors: {
        concept: 'Dividing by the wrong mass — using only the moving trolley afterwards, when the whole point is that both are now moving.',
      },
    }
  },
)

const thirdLaw = tpl(
  { id: 'adv-third-law', name: 'Equal forces, unequal results', skillIds: ['p-forces'], bucket: 'physics', difficulty: 4, variants: 4, minutes: 2.5, calibration: true },
  (rng, seed) => {
    const cases = [
      {
        setup: 'A 3,000 kg truck collides head-on with a 1,000 kg car.',
        q: 'How do the forces and accelerations compare?',
        correct: 'The forces on each are equal in size; the car accelerates three times as much because its mass is a third',
        wrong: [
          'The truck exerts a larger force, which is why the car comes off worse',
          'Both the forces and the accelerations are equal, since the collision is shared',
          'The car exerts a larger force because it was moving faster on impact',
        ],
        why: 'The forces of an interaction are always equal and opposite — that is the third law, and it holds regardless of mass or speed. What differs is the RESULT: with a = F/m, the same force produces three times the acceleration on a third of the mass. "The truck hits harder" describes the damage, not the force.',
      },
      {
        setup: 'A book rests on a table. The table pushes up on the book with force N; the book pushes down on the table with force N\'.',
        q: 'Which pairing is the third-law pair?',
        correct: 'N and N\' — the book on the table and the table on the book',
        wrong: [
          'N and the book\'s weight, since they are equal and opposite while it rests',
          'The book\'s weight and the table\'s weight',
          'There is no third-law pair, because nothing is moving',
        ],
        why: 'A third-law pair acts on two DIFFERENT objects and is always the same type of force. N and the weight both act on the book, so they are a balance, not a pair — and you can tell they are not a pair because removing the table would leave the weight untouched while N vanished.',
      },
      {
        setup: 'A person pushes a heavy crate across the floor at a steady speed.',
        q: 'How does their push compare with friction on the crate?',
        correct: 'They are equal — steady speed means zero net force, not zero force',
        wrong: [
          'The push is larger, otherwise the crate would not be moving at all',
          'Friction is larger, which is why the crate is difficult to push',
          'It cannot be determined without knowing the mass of the crate',
        ],
        why: 'Constant velocity means zero acceleration, hence zero NET force. Motion needs no net force to continue — only to change. "It is moving, so the push must win" is the single most persistent misreading of the first law.',
      },
      {
        setup: 'A rocket accelerates in space, far from any planet.',
        q: 'What is it pushing against?',
        correct: 'Its own exhaust — it throws gas backwards and the gas pushes it forwards',
        wrong: [
          'The surrounding air, which is why rockets need an atmosphere',
          'Nothing — rockets move by burning fuel, which creates motion directly',
          'The gravity of nearby bodies, which supplies the reaction force',
        ],
        why: 'The pair is rocket-on-gas and gas-on-rocket. No external medium is needed, which is exactly why rockets work in vacuum — and better there, without air resistance.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Forces in pairs',
      prompt: `${c.setup}\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'A third-law pair acts on two different objects and is the same kind of force.',
        'Separate the FORCE from what the force does. Equal forces on unequal masses give unequal accelerations.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const parallelBranch = tpl(
  { id: 'adv-parallel-branch', name: 'Adding a second path', skillIds: ['p-circuits'], bucket: 'physics', difficulty: 4, variants: 3, minutes: 2.5 },
  (rng, seed) => {
    const cases = [
      {
        q: 'An identical second bulb is added **in parallel** with the first. What happens to the total resistance of the circuit?',
        correct: 'It halves — a second path lets more current flow overall',
        wrong: [
          'It doubles, because there is now twice as much bulb in the circuit',
          'It is unchanged, because the bulbs are identical to each other',
          'It halves, but only while both bulbs are switched on at once',
        ],
        why: 'Resistance measures how hard it is for current to get through, and adding a parallel branch opens a second door. Two equal resistors R in parallel give R/2. Adding components makes resistance go UP only in series.',
      },
      {
        q: 'An identical second bulb is added **in parallel**. What happens to the brightness of the ORIGINAL bulb (ideal battery)?',
        correct: 'Unchanged — it still has the full battery voltage across it',
        wrong: [
          'It dims, because the two bulbs now share the available current',
          'It brightens, because the total current in the circuit has increased',
          'It dims at first and then recovers as the circuit settles',
        ],
        why: 'Each parallel branch sits directly across the battery, so each gets the full voltage and draws its own current. Sharing is what happens in SERIES, where the voltage divides. (A real battery has internal resistance, so the original would dim very slightly — the ideal case is the one that shows the principle.)',
      },
      {
        q: 'An identical second bulb is added **in series** with the first. What happens to the current through the original bulb?',
        correct: 'It halves — total resistance doubles while the voltage stays the same',
        wrong: [
          'It doubles, because there are now two bulbs drawing current',
          'It is unchanged, because current is used up equally by both bulbs',
          'It halves in the first bulb and stays the same in the second',
        ],
        why: 'In series the same current passes through everything, so it cannot differ between the bulbs. Doubling the resistance at fixed voltage halves the current, and both bulbs are dimmer than the single bulb was.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Series and parallel',
      prompt: `A single bulb is connected to a battery.\n\n${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Ask first: does this change how many PATHS the current has, or how long a single path is?',
        'Parallel adds paths and lowers total resistance; series lengthens one path and raises it.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}\n\nThe idea that current is "used up" as it goes round is the misconception underneath most wrong answers here. Current is not consumed — the same amount returns to the battery as leaves it. Energy is what gets transferred.`,
      commonErrors: {
        concept: 'Treating current as a substance that gets used up by each component in turn.',
      },
    }
  },
)

const densityMix = tpl(
  { id: 'adv-density-mix', name: 'Density of the whole', skillIds: ['p-density'], bucket: 'physics', difficulty: 4, variants: 12, minutes: 3 },
  (_rng, seed) => {
    const d1 = 2 + (seed % 3)
    const d2 = d1 + 2 + (Math.floor(seed / 3) % 2)
    const v1 = 10 * (1 + (Math.floor(seed / 6) % 2))
    const v2 = 20
    const mass = d1 * v1 + d2 * v2
    const density = round(mass / (v1 + v2), 3)
    const naive = round((d1 + d2) / 2, 2)
    return {
      title: 'Two materials, one object',
      prompt: `An object is made of **${v1} cm³** of a material with density **${d1} g/cm³** joined to **${v2} cm³** of a material with density **${d2} g/cm³**.\n\nWhat is the average density of the whole object, in g/cm³?`,
      answer: numeric(density, { tolerance: 0.02, unit: 'g/cm³' }),
      hints: [
        'Average density is total mass ÷ total volume. Find each mass separately first.',
        `Masses: ${d1} × ${v1} = ${d1 * v1} g and ${d2} × ${v2} = ${d2 * v2} g.`,
        `${mass} g ÷ ${v1 + v2} cm³ = **${density} g/cm³**.`,
      ],
      explanation: `Mass = ${d1 * v1} + ${d2 * v2} = ${mass} g. Volume = ${v1} + ${v2} = ${v1 + v2} cm³. Density = **${density} g/cm³**.\n\nNot ${naive} g/cm³. Averaging the two densities would only be right if the volumes were equal, and here ${v2 > v1 ? 'the denser' : 'the lighter'} material occupies more of the object — so the answer is pulled toward it. Densities are per-volume quantities, so they have to be weighted by volume.`,
      commonErrors: {
        concept: `Averaging the densities to get ${naive} g/cm³, which silently assumes equal volumes.`,
      },
    }
  },
)

// ================================================================ coding

/** Aliasing: two names, one list. The single most expensive beginner surprise. */
const aliasing = tpl(
  { id: 'adv-alias', name: 'Two names, one list', skillIds: ['c-arrays'], bucket: 'coding', difficulty: 4, variants: 12, minutes: 3, calibration: true },
  (_rng, seed) => {
    const a = 1 + (seed % 4)
    const b = a + 1 + (Math.floor(seed / 4) % 3)
    const pushed = 9
    // Simulate honestly.
    const list: number[] = [a, b]
    const alias = list
    alias.push(pushed)
    const copy = [...list]
    copy.push(0)
    const result = list.length
    return {
      title: 'What is printed?',
      prompt: `${code(
        `const list = [${a}, ${b}]\nconst alias = list\nconst copy = [...list]\n\nalias.push(${pushed})\ncopy.push(0)\n\nconsole.log(list.length)`,
      )}\nWhat is printed?`,
      answer: numeric(result),
      hints: [
        'Ask which lines create a NEW list and which only create a new name for an existing one.',
        '`alias = list` copies the reference, so both names point at the same list. `[...list]` builds a genuinely new one.',
        `So the push through \`alias\` grows the original (now ${list.join(', ')}) while \`copy\`'s push does not touch it: **${result}**.`,
      ],
      explanation: `\`alias\` and \`list\` are two names for one list, so \`alias.push(${pushed})\` makes it [${list.join(', ')}] — length **${result}**. \`copy\` was built with the spread, which produces a separate list, so pushing 0 onto it leaves \`list\` alone.\n\nThe reason this matters far beyond one puzzle: passing a list into a function passes the reference too, so a function that "just looks at" a list can modify the caller's data. When that bites, it is usually hours before anyone suspects the assignment.`,
      commonErrors: {
        concept: 'Reading `=` as "make a copy". For a list it makes a second name; only an explicit copy makes a second list.',
      },
    }
  },
)

/** Short-circuit evaluation — the right-hand side may never run. */
const shortCircuit = tpl(
  { id: 'adv-short-circuit', name: 'Which side actually runs', skillIds: ['c-bool'], bucket: 'coding', difficulty: 4, variants: 12, minutes: 3 },
  (_rng, seed) => {
    const useAnd = seed % 2 === 0
    const left = Math.floor(seed / 2) % 2 === 0
    const start = 1 + (Math.floor(seed / 4) % 3)
    // Simulate: bump() increments and returns true.
    let calls = 0
    const bump = () => {
      calls++
      return true
    }
    const leftVal = left
    if (useAnd) {
      // left && bump()  → bump only runs when left is true
      if (leftVal) bump()
    } else {
      // left || bump()  → bump only runs when left is false
      if (!leftVal) bump()
    }
    const total = start + calls
    return {
      title: 'Count the calls',
      prompt: `${code(
        `let count = ${start}\n\nfunction bump() {\n  count = count + 1\n  return true\n}\n\nconst flag = ${left}\nif (flag ${useAnd ? '&&' : '||'} bump()) {\n  // ...\n}\n\nconsole.log(count)`,
      )}\nWhat is printed?`,
      answer: numeric(total),
      hints: [
        'These operators stop early. Work out whether the left side alone already settles the result.',
        useAnd
          ? `With \`&&\`, a false left side settles it — the right side is skipped. Here flag is ${left}.`
          : `With \`||\`, a true left side settles it — the right side is skipped. Here flag is ${left}.`,
        `So bump() runs ${calls} time${calls === 1 ? '' : 's'}: ${start} + ${calls} = **${total}**.`,
      ],
      explanation: `\`${useAnd ? '&&' : '||'}\` evaluates left to right and stops as soon as the answer is certain. Here the flag is ${left}, so ${
        useAnd
          ? left
            ? 'the result is still undecided and bump() must run'
            : 'the result is already false and bump() is skipped'
          : left
            ? 'the result is already true and bump() is skipped'
            : 'the result is still undecided and bump() must run'
      } — bump() runs ${calls} time${calls === 1 ? '' : 's'}, printing **${total}**.\n\nThis is a feature, not a quirk: it is what makes \`if (list && list.length > 0)\` safe. It is also a trap, because a function call hidden on the right of an operator may silently never happen.`,
      commonErrors: {
        concept: 'Assuming both sides of a boolean operator always run. Evaluation stops as soon as the outcome is decided.',
      },
    }
  },
)

/** Nested loops with an early break. */
const nestedBreak = tpl(
  { id: 'adv-nested-break', name: 'Nested loops with an exit', skillIds: ['c-loops'], bucket: 'coding', difficulty: 4, variants: 12, minutes: 3 },
  (_rng, seed) => {
    const n = 3 + (seed % 3)
    const limit = 2 + (Math.floor(seed / 3) % 3)
    // Simulate honestly.
    let hits = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (j === limit) break
        hits++
      }
    }
    return {
      title: 'How many times?',
      prompt: `${code(
        `let hits = 0\nfor (let i = 0; i < ${n}; i++) {\n  for (let j = 0; j < ${n}; j++) {\n    if (j === ${limit}) break\n    hits = hits + 1\n  }\n}\nconsole.log(hits)`,
      )}\nWhat is printed?`,
      answer: numeric(hits),
      hints: [
        '`break` leaves only the loop it is inside. Ask what the OUTER loop does afterwards.',
        `The inner loop counts j = 0, 1, … and stops the moment j reaches ${limit}, so it increments hits ${Math.min(limit, n)} time${Math.min(limit, n) === 1 ? '' : 's'} per outer pass.`,
        `${n} outer passes × ${Math.min(limit, n)} = **${hits}**.`,
      ],
      explanation: `The inner loop breaks when j === ${limit}, so per outer pass it increments hits for j = 0…${Math.min(limit, n) - 1}, which is ${Math.min(limit, n)} time${Math.min(limit, n) === 1 ? '' : 's'}. The outer loop still runs its full ${n} passes, because \`break\` only exits the inner one. Total **${hits}**.\n\nThe usual wrong answer treats \`break\` as leaving everything. If that were wanted you would need a flag, a labelled break, or to move the code into a function and \`return\`.`,
      commonErrors: {
        concept: '`break` exiting both loops. It exits exactly one — the nearest enclosing loop.',
      },
    }
  },
)

/** Parameters are copies; objects passed in are not. */
const paramCopy = tpl(
  { id: 'adv-param-copy', name: 'What a function can change', skillIds: ['c-funcs'], bucket: 'coding', difficulty: 4, variants: 8, minutes: 3 },
  (_rng, seed) => {
    const start = 2 + (seed % 4)
    const add = 1 + (Math.floor(seed / 4) % 2)
    // Simulate honestly.
    let n = start
    const arr: number[] = [start]
    const f = (num: number, list: number[]) => {
      num = num + add
      list.push(add)
    }
    f(n, arr)
    const printed = `${n} ${arr.length}`
    return {
      title: 'What is printed?',
      prompt: `${code(
        `function change(num, list) {\n  num = num + ${add}\n  list.push(${add})\n}\n\nlet n = ${start}\nconst arr = [${start}]\n\nchange(n, arr)\n\nconsole.log(n, arr.length)`,
      )}\nEnter the two printed values separated by a space.`,
      answer: { type: 'text', accept: [printed, printed.replace(' ', ', '), printed.replace(' ', ',')], placeholder: 'e.g. 5 2' },
      hints: [
        'Treat the two parameters separately — one is a number, the other is a list.',
        'Reassigning a parameter only rebinds the local name. Calling a method on a list reaches the caller\'s list.',
        `So n is unchanged at ${n}, and arr has grown to length ${arr.length}: **${printed}**.`,
      ],
      explanation: `\`num = num + ${add}\` rebinds the function's own parameter and never touches \`n\`, which stays **${n}**. \`list.push(${add})\` mutates the very list the caller passed in, so \`arr.length\` becomes **${arr.length}**.\n\nThe distinction is not number-versus-list but REASSIGNING versus MUTATING. Assigning to a parameter is always local; calling a method that changes an object is not, whatever type it is.`,
      commonErrors: {
        concept: 'Concluding that functions can never change their caller\'s data — they cannot rebind your variables, but they can mutate objects you hand them.',
      },
    }
  },
)

/** Complexity where it actually bites: the numbers, not the notation. */
const complexityScale = tpl(
  { id: 'adv-complexity-scale', name: 'Which one survives scale', skillIds: ['c-algo'], bucket: 'coding', difficulty: 4, variants: 8, minutes: 3, transfer: true },
  (rng, seed) => {
    const n = [1_000, 10_000, 100_000][seed % 3]
    const factor = [10, 100, 1_000][Math.floor(seed / 3) % 3]
    const quadratic = n * n
    const linearish = n * Math.ceil(Math.log2(n))
    const correct = `B — about ${linearish.toLocaleString('en-US')} steps against A's ${quadratic.toLocaleString('en-US')}`
    return {
      title: 'Two working solutions',
      prompt: `Both algorithms produce correct results on a list of **${n.toLocaleString('en-US')}** items.\n\n· **A** compares every item with every other item.\n· **B** sorts the list first, then makes one pass through it.\n\nEven though A is ${factor}× faster per individual step, which finishes sooner — and roughly how many steps does the winner take?`,
      answer: mcq(rng, correct, [
        `A — a faster step wins once the constant factor of ${factor}× is included`,
        `They finish at about the same time, since both must examine all ${n.toLocaleString('en-US')} items`,
        'It cannot be determined without knowing the programming language used',
      ]),
      hints: [
        'Count the steps each does before worrying about how fast a step is.',
        `A is every-pair, so about n² = ${quadratic.toLocaleString('en-US')}. B is a sort (n log n) plus one pass, so about ${linearish.toLocaleString('en-US')}.`,
        `${quadratic.toLocaleString('en-US')} ÷ ${linearish.toLocaleString('en-US')} ≈ ${Math.round(quadratic / linearish)}×, which a ${factor}× faster step ${Math.round(quadratic / linearish) > factor ? 'cannot' : 'could'} close.`,
      ],
      explanation: `A does about n² = ${quadratic.toLocaleString('en-US')} comparisons. B sorts (about n log n = ${linearish.toLocaleString('en-US')}) then makes one pass. That is roughly **${Math.round(quadratic / linearish)}× fewer steps**, so ${Math.round(quadratic / linearish) > factor ? `a ${factor}× faster step is not enough to save A` : `the ${factor}× per-step advantage does close the gap at this size — which is the honest answer: constants matter until n is large enough`}.\n\nThe general point: a constant speed-up is a fixed multiplier, while the difference between n² and n log n grows without limit. Double the data and A's work quadruples while B's barely moves.`,
      commonErrors: {
        strategy: 'Optimising the speed of a step when the number of steps is the problem. A faster loop body never rescues the wrong shape of algorithm.',
      },
    }
  },
)

export const ADVANCED_STEM_TEMPLATES: ItemTemplate[] = [
  averageSpeed,
  velocityTimeArea,
  inelasticCollision,
  thirdLaw,
  parallelBranch,
  densityMix,
  aliasing,
  shortCircuit,
  nestedBreak,
  paramCopy,
  complexityScale,
]
