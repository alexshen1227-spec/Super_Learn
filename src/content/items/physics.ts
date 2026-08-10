/**
 * Physics items — quantitative, honest, grade 8–9 level.
 * Values constructed so answers come out clean; tolerance only where rounding
 * is mathematically expected.
 */
import type { ItemTemplate } from '../../domain/types'
import { pick, rint } from '../../engine/rng'
import { cycle, mcq, mcqNoted, numeric, round, tpl} from '../lib'

const measureUnits = tpl(
  { id: 'p-si-units', name: 'SI units', skillIds: ['p-measure'], bucket: 'physics', difficulty: 1, variants: 4, minutes: 1.5 },
  (rng, seed) => {
    const cases = [
      { q: 'speed', correct: 'meters per second (m/s)', wrong: ['kilograms (kg)', 'newtons (N)', 'seconds per meter (s/m)'] },
      { q: 'force', correct: 'newtons (N)', wrong: ['joules (J)', 'watts (W)', 'kilograms (kg)'] },
      { q: 'energy', correct: 'joules (J)', wrong: ['newtons (N)', 'volts (V)', 'meters per second (m/s)'] },
      { q: 'density', correct: 'kilograms per cubic meter (kg/m³)', wrong: ['kilograms (kg)', 'cubic meters (m³)', 'newtons per meter (N/m)'] },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Which unit?',
      prompt: `Which SI unit measures **${c.q}**?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        `Build it from the definition: what is ${c.q} made of?`,
        'Speed = distance/time; force = mass × acceleration; energy = force × distance; density = mass/volume.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}** — the unit mirrors the definition. Units are not labels; they are algebra you can check answers with.`,
    }
  },
)

const dimensionalCheck = tpl(
  { id: 'p-dimensional', name: 'Dimensional check', skillIds: ['p-measure'], bucket: 'physics', difficulty: 2, variants: 2, minutes: 2, transfer: true },
  (rng, seed) => {
    const cases = [
      {
        given: 'distance = 120 m and time = 30 s',
        q: 'A student computes speed as 30 ÷ 120 = 0.25. What tells you the setup is wrong before checking any arithmetic?',
        correct: 'The units come out as s/m, not m/s — the division is upside down',
        wrong: ['0.25 is too small to be a speed', 'Speeds must be whole numbers', 'Nothing — 0.25 m/s is correct here'],
        why: 'Carrying units through the calculation (s ÷ m = s/m) exposes the inverted formula immediately. The right answer is 120/30 = 4 m/s.',
      },
      {
        given: 'the formula d = v·t',
        q: 'Which combination of units would make the two sides of d = v·t consistent?',
        correct: 'd in meters, v in m/s, t in seconds',
        wrong: ['d in meters, v in km/h, t in seconds', 'd in km, v in m/s, t in hours', 'd in meters, v in m/s, t in minutes'],
        why: '(m/s)·s = m — matching units on both sides. Mixed unit systems need converting first.',
      },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Units as error detectors',
      prompt: `Given ${c.given}: ${c.q}`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Treat units like algebra symbols — multiply and cancel them.',
        'Write the units of each quantity into the formula and simplify.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. ${c.why}`,
    }
  },
)

const speedBasic = tpl(
  { id: 'p-speed', name: 'Speed problems', skillIds: ['p-motion'], bucket: 'physics', difficulty: 2, variants: 16, minutes: 2 },
  (rng) => {
    const v = pick(rng, [4, 5, 8, 10, 12, 15, 20, 25])
    const t = rint(rng, 3, 12)
    const d = v * t
    const solveFor = pick(rng, ['d', 'v', 't'] as const)
    const prompt =
      solveFor === 'd'
        ? `A cyclist rides at **${v} m/s** for **${t} s**. How far do they travel, in meters?`
        : solveFor === 'v'
          ? `A runner covers **${d} m** in **${t} s** at a steady pace. What is their speed, in m/s?`
          : `A cart moves **${d} m** at a steady **${v} m/s**. How long does it take, in seconds?`
    const ans = solveFor === 'd' ? d : solveFor === 'v' ? v : t
    return {
      title: 'Steady motion',
      prompt,
      answer: numeric(ans),
      hints: [
        'One relationship: distance = speed × time. Which two do you know?',
        solveFor === 'd' ? `d = ${v} × ${t}.` : solveFor === 'v' ? `v = d ÷ t = ${d} ÷ ${t}.` : `t = d ÷ v = ${d} ÷ ${v}.`,
        `Worked path: **${ans}**.`,
      ],
      explanation:
        solveFor === 'd'
          ? `d = v·t = ${v} × ${t} = **${d} m**.`
          : solveFor === 'v'
            ? `v = d/t = ${d}/${t} = **${v} m/s**. Units check: m ÷ s = m/s ✓.`
            : `t = d/v = ${d}/${v} = **${t} s**. Units check: m ÷ (m/s) = s ✓.`,
    }
  },
)

const velocityVsSpeed = tpl(
  { id: 'p-velocity-concept', name: 'Speed vs velocity', skillIds: ['p-motion'], bucket: 'physics', difficulty: 2, variants: 1, minutes: 2 },
  (rng) => {
    const d = pick(rng, [200, 300, 400])
    return {
      title: 'A lap around the track',
      prompt: `A runner completes one full **${d} m** lap in 100 s, finishing exactly where they started. Which statement is right?`,
      answer: mcq(rng, `Average speed is ${d / 100} m/s, but average velocity is 0`, [
        `Average velocity is ${d / 100} m/s, but average speed is 0`,
        `Both are ${d / 100} m/s`,
        'Both are 0',
      ]),
      hints: [
        'Speed uses distance traveled; velocity uses displacement (net change in position).',
        'They ended where they began — what is the displacement?',
        `Worked path: speed = ${d}/100 = ${d / 100} m/s; displacement = 0 → velocity = **0**.`,
      ],
      explanation: `Distance = ${d} m → average speed ${d / 100} m/s. Displacement = 0 (same start and end) → average velocity **0**. The two ideas split exactly when the path bends.`,
    }
  },
)

const motionGraph = tpl(
  { id: 'p-motion-graph', name: 'Position-time graphs', skillIds: ['p-graphs'], bucket: 'physics', difficulty: 2, variants: 12, minutes: 2.5 },
  (rng) => {
    const v1 = rint(rng, 2, 6)
    const flat = rint(rng, 2, 5)
    const t1 = rint(rng, 3, 6)
    const seg = pick(rng, ['first', 'middle', 'total'] as const)
    const d1 = v1 * t1
    const table = `| time (s) | position (m) |\n| --- | --- |\n| 0 | 0 |\n| ${t1} | ${d1} |\n| ${t1 + flat} | ${d1} |`
    const ans = seg === 'first' ? v1 : seg === 'middle' ? 0 : round(d1 / (t1 + flat), 2)
    return {
      title: 'Read the motion',
      prompt: `A walker's position over time:\n\n${table}\n\n${
        seg === 'first'
          ? `What is the speed during the **first ${t1} s**, in m/s?`
          : seg === 'middle'
            ? `What is the speed between **t = ${t1} s and t = ${t1 + flat} s**, in m/s?`
            : `What is the **average speed** for the whole trip, in m/s?`
      }`,
      answer: numeric(ans, seg === 'total' ? { tolerance: 0.01 } : {}),
      hints: [
        'Speed on a position-time record = change in position ÷ change in time.',
        seg === 'middle' ? `Position goes ${d1} → ${d1}. What changed?` : seg === 'first' ? `Δposition = ${d1} m over ${t1} s.` : `Total distance ${d1} m over total time ${t1 + flat} s.`,
        `Worked path: **${ans} m/s**.`,
      ],
      explanation:
        seg === 'first'
          ? `(${d1} − 0)/(${t1} − 0) = **${v1} m/s** — the slope of that segment.`
          : seg === 'middle'
            ? `Position does not change, so speed = **0 m/s** — a flat segment means standing still, not "no graph".`
            : `Average speed = total distance / total time = ${d1}/${t1 + flat} = **${ans} m/s** — NOT the average of the two segment speeds, because they lasted different times.`,
      commonErrors: { concept: seg === 'total' ? `Averaging ${v1} and 0 to get ${v1 / 2} ignores how LONG each speed lasted.` : 'Reading position values as speeds is the classic graph error.' },
    }
  },
)

const acceleration = tpl(
  { id: 'p-acceleration', name: 'Acceleration', skillIds: ['p-accel'], bucket: 'physics', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const a = rint(rng, 2, 5)
    const t = rint(rng, 3, 8)
    const v0 = pick(rng, [0, 2, 4, 5])
    const v1 = v0 + a * t
    const solveA = rng() < 0.6
    return {
      title: 'Changing velocity',
      prompt: solveA
        ? `A kart speeds up from **${v0} m/s** to **${v1} m/s** in **${t} s**. What is its acceleration, in m/s²?`
        : `A kart at **${v0} m/s** accelerates at **${a} m/s²** for **${t} s**. What is its final velocity, in m/s?`,
      answer: numeric(solveA ? a : v1),
      hints: [
        'Acceleration = change in velocity ÷ time.',
        solveA ? `Δv = ${v1} − ${v0} = ${v1 - v0} m/s.` : `Velocity gained: ${a} × ${t} = ${a * t} m/s.`,
        `Worked path: **${solveA ? a : v1}**.`,
      ],
      explanation: solveA
        ? `a = (${v1} − ${v0})/${t} = ${v1 - v0}/${t} = **${a} m/s²** — it gains ${a} m/s of speed every second.`
        : `v = v₀ + at = ${v0} + ${a}×${t} = **${v1} m/s**.`,
    }
  },
)

const newtonSecond = tpl(
  { id: 'p-fma', name: 'F = ma', skillIds: ['p-forces'], bucket: 'physics', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const m = pick(rng, [2, 4, 5, 8, 10, 20])
    const a = rint(rng, 2, 6)
    const f = m * a
    const solveFor = pick(rng, ['f', 'a', 'm'] as const)
    return {
      title: "Newton's second law",
      prompt:
        solveFor === 'f'
          ? `A **${m} kg** wagon accelerates at **${a} m/s²**. What net force acts on it, in newtons?`
          : solveFor === 'a'
            ? `A net force of **${f} N** acts on a **${m} kg** box. What is its acceleration, in m/s²?`
            : `A net force of **${f} N** gives an object an acceleration of **${a} m/s²**. What is its mass, in kg?`,
      answer: numeric(solveFor === 'f' ? f : solveFor === 'a' ? a : m),
      hints: [
        'F = ma relates the three — cover the one you want.',
        solveFor === 'f' ? `F = ${m} × ${a}.` : solveFor === 'a' ? `a = F/m = ${f}/${m}.` : `m = F/a = ${f}/${a}.`,
        `Worked path: **${solveFor === 'f' ? f : solveFor === 'a' ? a : m}**.`,
      ],
      explanation: `F = ma with two knowns: **${solveFor === 'f' ? `${m} × ${a} = ${f} N` : solveFor === 'a' ? `${f}/${m} = ${a} m/s²` : `${f}/${a} = ${m} kg`}**. This is the NET force — forces that cancel accelerate nothing.`,
    }
  },
)

const netForce = tpl(
  { id: 'p-net-force', name: 'Net force reasoning', skillIds: ['p-forces'], bucket: 'physics', difficulty: 3, variants: 12, minutes: 2.5 },
  (rng) => {
    const push = rint(rng, 20, 60)
    const friction = rint(rng, 5, push - 10)
    const m = pick(rng, [5, 10, 15])
    const net = push - friction
    const ans = round(net / m, 2)
    return {
      title: 'Two forces, one motion',
      prompt: `You push a **${m} kg** crate with **${push} N** while friction resists with **${friction} N**. What is the crate's acceleration, in m/s²?`,
      answer: numeric(ans, { tolerance: 0.01 }),
      hints: [
        'Only the NET force accelerates the crate.',
        `Net = ${push} − ${friction} = ${net} N (they point opposite ways).`,
        `Worked path: a = ${net}/${m} = **${ans} m/s²**.`,
      ],
      explanation: `Opposing forces subtract: F_net = ${push} − ${friction} = ${net} N. Then a = F/m = ${net}/${m} = **${ans} m/s²**. Free-body habit: list forces with directions BEFORE computing.`,
      commonErrors: { strategy: `Using the ${push} N push alone ignores friction — the crate feels the sum of everything acting on it.` },
    }
  },
)

const balancedForces = tpl(
  { id: 'p-balanced', name: 'Balanced forces', skillIds: ['p-forces'], bucket: 'physics', difficulty: 2, variants: 1, minutes: 2 },
  (rng) => {
    const v = pick(rng, [3, 5, 8])
    const noted = mcqNoted(rng, '0 N — balanced forces', [
      [`${v} N in the direction of motion`, '"Motion needs force" — the pre-Newtonian intuition. Force changes motion; steady motion needs zero NET force.', 'concept'],
      ['A small forward force, or it would stop', 'It would only stop because of FRICTION — a real force the drive force cancels. The net is still zero.', 'concept'],
      ['Cannot tell without its mass', 'Mass matters for F = ma only when a ≠ 0 — constant velocity means a = 0 regardless of mass.', 'concept'],
    ])
    return {
      title: 'Constant velocity',
      prompt: `A delivery robot moves in a straight line at a constant **${v} m/s**. What is the net force on it?`,
      answer: noted.answer,
      distractorNotes: noted.distractorNotes,
      distractorTags: noted.distractorTags,
      hints: [
        'Does constant velocity require a push? What does F = ma say when velocity is not changing?',
        'a = 0 here. So F_net = m × 0.',
        'Worked path: **0 N** — the drive force exactly cancels friction/drag.',
      ],
      explanation: `Constant velocity means a = 0, so F_net = 0 — the motor's force balances resistance exactly. Motion does not need net force; CHANGING motion does. (This is Newton's first law, and the everyday intuition it corrects.)`,
      commonErrors: { concept: '"Moving things must have a force pushing them" is the pre-Newtonian intuition this item exists to repair.' },
    }
  },
)

const workEnergy = tpl(
  { id: 'p-work', name: 'Work & energy', skillIds: ['p-energy'], bucket: 'physics', difficulty: 2, variants: 10, minutes: 2 },
  (rng) => {
    const f = pick(rng, [10, 15, 20, 25, 40])
    const d = rint(rng, 2, 10)
    return {
      title: 'Work done',
      prompt: `You push a sled with a steady **${f} N** force over **${d} m** (force along the motion). How much work do you do, in joules?`,
      answer: numeric(f * d),
      hints: [
        'Work = force × distance (when they align).',
        `W = ${f} × ${d}.`,
        `Worked path: **${f * d} J**.`,
      ],
      explanation: `W = F·d = ${f} × ${d} = **${f * d} J** — that energy went into the sled's motion and heat from friction. No distance, no work, no matter how hard you push.`,
    }
  },
)

const kineticEnergy = tpl(
  { id: 'p-kinetic', name: 'Kinetic energy', skillIds: ['p-energy'], bucket: 'physics', difficulty: 3, variants: 8, minutes: 2.5, transfer: true, calibration: true },
  (rng) => {
    const m = pick(rng, [2, 4, 6, 8])
    const v = pick(rng, [2, 3, 4, 5, 10])
    const ke = 0.5 * m * v * v
    const doubled = rng() < 0.4
    if (doubled) {
      return {
        title: 'Double the speed',
        prompt: `A ball has kinetic energy **${ke} J**. If its speed **doubles** (same mass), what is its new kinetic energy, in joules?`,
        answer: numeric(4 * ke),
        hints: [
          'KE = ½mv² — how does v enter the formula?',
          'Doubling v squares into the energy: (2v)² = 4v².',
          `Worked path: 4 × ${ke} = **${4 * ke} J**.`,
        ],
        explanation: `KE ∝ v², so ×2 speed → ×4 energy: **${4 * ke} J**. This is why crash damage grows so fast with speed — the square is not an accident of algebra, it is the physics.`,
        commonErrors: { concept: 'Doubling to ' + 2 * ke + ' J treats KE as linear in speed — the square is the whole point.' },
      }
    }
    return {
      title: 'Kinetic energy',
      prompt: `A **${m} kg** ball moves at **${v} m/s**. What is its kinetic energy, in joules?`,
      answer: numeric(ke),
      hints: [
        'KE = ½ m v².',
        `v² = ${v * v}.`,
        `Worked path: ½ × ${m} × ${v * v} = **${ke} J**.`,
      ],
      explanation: `KE = ½mv² = ½ × ${m} × ${v * v} = **${ke} J**. Square the speed FIRST, then halve and multiply.`,
    }
  },
)

const momentum = tpl(
  { id: 'p-momentum', name: 'Momentum', skillIds: ['p-momentum'], bucket: 'physics', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const m1 = pick(rng, [2, 3, 5, 8, 10])
    const v1 = rint(rng, 2, 9)
    const compare = rng() < 0.4
    if (compare) {
      const m2 = m1 * 2
      const v2 = Math.max(1, Math.floor(v1 / 2) + (v1 % 2 === 0 ? 0 : 1))
      const p1 = m1 * v1
      const p2 = m2 * v2
      const correct = p1 > p2 ? `The ${m1} kg object` : p2 > p1 ? `The ${m2} kg object` : 'They are equal'
      return {
        title: 'Which has more momentum?',
        prompt: `Object A: **${m1} kg at ${v1} m/s**. Object B: **${m2} kg at ${v2} m/s**. Which has more momentum?`,
        answer: mcq(rng, correct, [`The ${m1} kg object`, `The ${m2} kg object`, 'They are equal'].filter((o) => o !== correct)),
        hints: [
          'Momentum = mass × velocity — compute both.',
          `A: ${m1} × ${v1} = ${p1}. B: ${m2} × ${v2} = ${p2}.`,
          `Worked path: **${correct}** (${Math.max(p1, p2)} vs ${Math.min(p1, p2)} kg·m/s).`,
        ],
        explanation: `p = mv: A has ${p1} kg·m/s, B has ${p2} kg·m/s → **${correct}**. Neither mass nor speed alone decides it.`,
      }
    }
    return {
      title: 'Momentum',
      prompt: `A **${m1} kg** dog runs at **${v1} m/s**. What is its momentum, in kg·m/s?`,
      answer: numeric(m1 * v1),
      hints: ['p = m × v.', `p = ${m1} × ${v1}.`, `Worked path: **${m1 * v1} kg·m/s**.`],
      explanation: `p = mv = ${m1} × ${v1} = **${m1 * v1} kg·m/s**.`,
    }
  },
)

const density = tpl(
  { id: 'p-density', name: 'Density', skillIds: ['p-density'], bucket: 'physics', difficulty: 2, variants: 14, minutes: 2 },
  (rng) => {
    const rho = pick(rng, [2, 3, 5, 8, 0.5])
    const v = rint(rng, 2, 10)
    const m = rho * v
    const solveFor = pick(rng, ['rho', 'm'] as const)
    return {
      title: 'Density',
      prompt:
        solveFor === 'rho'
          ? `A block has mass **${m} g** and volume **${v} cm³**. What is its density, in g/cm³?`
          : `A liquid has density **${rho} g/cm³**. What is the mass of **${v} cm³** of it, in grams?`,
      answer: numeric(solveFor === 'rho' ? rho : m),
      hints: [
        'Density = mass ÷ volume — how much stuff per unit of space.',
        solveFor === 'rho' ? `ρ = ${m}/${v}.` : `m = ρ × V = ${rho} × ${v}.`,
        `Worked path: **${solveFor === 'rho' ? rho : m}**.`,
      ],
      explanation:
        solveFor === 'rho'
          ? `ρ = m/V = ${m}/${v} = **${rho} g/cm³**${rho < 1 ? ' — less than water (1 g/cm³), so it floats' : rho > 1 ? ' — denser than water, so it sinks' : ''}.`
          : `m = ρV = ${rho} × ${v} = **${m} g**.`,
    }
  },
)

const ohmsLaw = tpl(
  { id: 'p-ohm', name: "Ohm's law", skillIds: ['p-circuits'], bucket: 'physics', difficulty: 2, variants: 12, minutes: 2 },
  (rng) => {
    const i = pick(rng, [0.5, 1, 2, 3, 4])
    const r = pick(rng, [3, 5, 6, 10, 12])
    const vv = i * r
    const solveFor = pick(rng, ['v', 'i', 'r'] as const)
    return {
      title: 'Circuit math',
      prompt:
        solveFor === 'v'
          ? `A **${i} A** current flows through a **${r} Ω** resistor. What voltage drives it, in volts?`
          : solveFor === 'i'
            ? `A **${vv} V** battery pushes current through a **${r} Ω** resistor. What is the current, in amps?`
            : `A **${vv} V** source drives **${i} A** through a resistor. What is its resistance, in ohms?`,
      answer: numeric(solveFor === 'v' ? vv : solveFor === 'i' ? i : r),
      hints: [
        'V = I × R connects the three.',
        solveFor === 'v' ? `V = ${i} × ${r}.` : solveFor === 'i' ? `I = V/R = ${vv}/${r}.` : `R = V/I = ${vv}/${i}.`,
        `Worked path: **${solveFor === 'v' ? vv : solveFor === 'i' ? i : r}**.`,
      ],
      explanation: `V = IR → **${solveFor === 'v' ? `${i} × ${r} = ${vv} V` : solveFor === 'i' ? `${vv}/${r} = ${i} A` : `${vv}/${i} = ${r} Ω`}**. Intuition: voltage pushes, resistance resists, current is what results.`,
    }
  },
)

const orderMagnitude = tpl(
  { id: 'p-order-magnitude', name: 'Orders of magnitude', skillIds: ['p-estimate'], bucket: 'physics', difficulty: 2, variants: 4, minutes: 2, transfer: true },
  (rng, seed) => {
    const cases = [
      { q: 'the height of a door', correct: '2 × 10⁰ m (about 2 m)', wrong: ['2 × 10¹ m (about 20 m)', '2 × 10⁻² m (about 2 cm)', '2 × 10² m (about 200 m)'] },
      { q: 'the mass of an apple', correct: '2 × 10⁻¹ kg (about 200 g)', wrong: ['2 × 10¹ kg (about 20 kg)', '2 × 10⁻³ kg (about 2 g)', '2 × 10⁰ kg (about 2 kg)'] },
      { q: 'the number of seconds in a day', correct: '≈ 9 × 10⁴ s', wrong: ['≈ 9 × 10² s', '≈ 9 × 10⁶ s', '≈ 9 × 10³ s'] },
      { q: 'walking speed', correct: '≈ 1.5 × 10⁰ m/s', wrong: ['≈ 1.5 × 10¹ m/s', '≈ 1.5 × 10⁻² m/s', '≈ 1.5 × 10² m/s'] },
    ]
    const c = cycle(seed, cases)
    return {
      title: 'Pick the right power of ten',
      prompt: `Which is the best estimate for **${c.q}**?`,
      answer: mcq(rng, c.correct, c.wrong),
      hints: [
        'Anchor on something you know cold (your height ≈ 1.7 m, a bag of sugar ≈ 1 kg).',
        'Rule out the absurd powers first — off by 10× is visible in real life.',
        `Worked path: **${c.correct}**.`,
      ],
      explanation: `**${c.correct}**. Order-of-magnitude sense is the physicist's error detector: a calculated answer in the wrong power of ten is wrong, whatever the algebra said.`,
    }
  },
)

/** A construction task, distinct from merely recognising a plausible scale. */
const backOfEnvelopeMass = tpl(
  {
    id: 'p-back-of-envelope-mass',
    name: 'Back-of-the-envelope mass',
    skillIds: ['p-estimate'],
    bucket: 'physics',
    difficulty: 3,
    variants: 36,
    minutes: 2.5,
    transfer: true,
    calibration: true,
  },
  (_rng, seed) => {
    const length = 4 + (seed % 4)
    const width = 3 + (Math.floor(seed / 4) % 3)
    const height = 2 + (Math.floor(seed / 12) % 3)
    const volume = length * width * height
    const mass = round(volume * 1.2, 1)
    return {
      title: 'Estimate the mass of the air',
      prompt:
        `A room is about **${length} m × ${width} m × ${height} m**. Use **1.2 kg/m³** as the density of air. ` +
        'About how many kilograms of air are in the room?',
      answer: numeric(mass, { tolerance: 0.1, unit: 'kg' }),
      hints: [
        'First estimate the room volume. Keep the units attached.',
        `Volume ≈ ${length} × ${width} × ${height} = ${volume} m³. Then multiply by about 1.2 kg for each cubic meter.`,
        `Worked path: ${volume} × 1.2 ≈ **${mass} kg**.`,
      ],
      explanation:
        `The room volume is about **${volume} m³**. At about **1.2 kg per m³**, the air mass is ` +
        `**${volume} × 1.2 ≈ ${mass} kg**. Back-of-the-envelope physics turns dimensions into a scale before worrying about precision.`,
    }
  },
)

export const PHYSICS_TEMPLATES: ItemTemplate[] = [
  measureUnits,
  dimensionalCheck,
  speedBasic,
  velocityVsSpeed,
  motionGraph,
  acceleration,
  newtonSecond,
  netForce,
  balancedForces,
  workEnergy,
  kineticEnergy,
  momentum,
  density,
  ohmsLaw,
  orderMagnitude,
  backOfEnvelopeMass,
]
