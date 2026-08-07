/**
 * Physics depth — quantitative practice with enumerated parameters.
 *
 * Every generator indexes its parameter space by seed rather than sampling it,
 * so the declared variant count equals the number of genuinely distinct
 * problems (the content audit enforces this). Values are chosen so every
 * answer is exact and typeable.
 */
import type { ItemTemplate } from '../../domain/types'
import { mcq, numeric, tpl } from '../lib'

const kinematics = tpl(
  { id: 'phy-avg-speed', name: 'Average speed over legs', skillIds: ['p-motion'], bucket: 'physics', difficulty: 3, variants: 24, minutes: 2.5, calibration: true },
  (_rng, seed) => {
    const D1 = [30, 40, 60, 90][seed % 4]
    const V1 = [10, 15, 20][Math.floor(seed / 4) % 3]
    const V2 = [30, 60][Math.floor(seed / 12) % 2]
    const r2 = (v: number) => Math.round(v * 100) / 100
    // Round every time that reaches the screen: 40/30 is 1.3333333333333333.
    const t1 = r2(D1 / V1)
    const t2 = r2(D1 / V2)
    const avg = (2 * D1) / (D1 / V1 + D1 / V2)
    const naive = (V1 + V2) / 2
    return {
      title: 'Not the average of the speeds',
      prompt: `A trip covers **${D1} km at ${V1} km/h**, then the **same ${D1} km back at ${V2} km/h**.\n\nWhat is the average speed for the whole journey, in km/h?`,
      answer: numeric(r2(avg), { tolerance: 0.02 }),
      hints: [
        'Average speed is total distance ÷ total time — never the average of two speeds.',
        `Time out: ${D1}/${V1} = ${t1} h. Time back: ${D1}/${V2} = ${t2} h.`,
        `Total ${2 * D1} km ÷ ${r2(t1 + t2)} h = **${r2(avg)} km/h**.`,
      ],
      explanation: `Total distance ${2 * D1} km, total time ${t1} + ${t2} = ${r2(t1 + t2)} h, so average speed is **${r2(avg)} km/h**.\n\nThe tempting answer is ${naive} km/h — the mean of the two speeds — and it is wrong because you spend MORE time at the slower speed. Time, not distance, is what the average weights.`,
      commonErrors: {
        concept: `Averaging the speeds gives ${naive}. That would only be right if equal TIME were spent at each speed, not equal distance.`,
      },
    }
  },
)

const forces = tpl(
  { id: 'phy-net-force', name: 'Net force and acceleration', skillIds: ['p-forces'], bucket: 'physics', difficulty: 2, variants: 30, minutes: 2 },
  (_rng, seed) => {
    const m = [2, 4, 5, 10, 20][seed % 5]
    const f1 = [10, 20, 30][Math.floor(seed / 5) % 3]
    const f2 = [4, 10][Math.floor(seed / 15) % 2]
    const net = f1 - f2
    const a = net / m
    return {
      title: 'Net first, then F = ma',
      prompt: `A **${m} kg** crate is pushed forward with **${f1} N** while friction pushes back with **${f2} N**.\n\nWhat is its acceleration, in m/s²?`,
      answer: numeric(Math.round(a * 1000) / 1000, { tolerance: 0.01 }),
      hints: [
        'Forces in opposite directions partly cancel. Find the NET force first.',
        `${f1} − ${f2} = ${net} N.`,
        `a = F/m = ${net}/${m} = **${Math.round(a * 1000) / 1000} m/s²**.`,
      ],
      explanation: `Net force = ${f1} − ${f2} = ${net} N, so a = F/m = ${net}/${m} = **${Math.round(a * 1000) / 1000} m/s²**.\n\nUsing the applied force alone gives ${Math.round((f1 / m) * 1000) / 1000} — too large. F = ma always takes the NET force, which is why drawing the forces before computing anything is worth the ten seconds.`,
      commonErrors: {
        strategy: `Using ${f1} N without subtracting friction gives ${Math.round((f1 / m) * 1000) / 1000} m/s². The net force is the only one F = ma accepts.`,
      },
    }
  },
)

const energyConversion = tpl(
  { id: 'phy-energy-convert', name: 'Height to speed', skillIds: ['p-energy'], bucket: 'physics', difficulty: 4, variants: 20, minutes: 3, transfer: true },
  (_rng, seed) => {
    // v = sqrt(2gh) with g = 10; choose h so v comes out exact.
    const V = [10, 20, 30, 40][seed % 4]
    const h = (V * V) / 20
    const m = [2, 5, 10, 20, 50][Math.floor(seed / 4) % 5]
    return {
      title: 'Where does the energy go?',
      prompt: `A **${m} kg** object is dropped from rest at a height of **${h} m**. Using **g ≈ 10 m/s²** and ignoring air resistance, how fast is it moving just before it lands, in m/s?`,
      answer: numeric(V),
      hints: [
        'Gravitational potential energy converts to kinetic energy: mgh becomes ½mv².',
        'The mass appears on both sides and cancels — the answer does not depend on it.',
        `v = √(2gh) = √(2 × 10 × ${h}) = **${V} m/s**.`,
      ],
      explanation: `Setting mgh = ½mv² and cancelling m gives v = √(2gh) = √(2 × 10 × ${h}) = **${V} m/s**.\n\nThe mass cancelling is the striking part: a ${m} kg object and a 1 kg object dropped from ${h} m arrive at the same speed. That is Galileo's result falling straight out of the energy bookkeeping, and it is why the ${m} kg in the question is deliberately irrelevant.`,
      commonErrors: {
        concept: 'Assuming a heavier object lands faster. Mass cancels: it appears in both the energy it gains and the energy it needs to move.',
      },
    }
  },
)

const densityFloat = tpl(
  { id: 'phy-density-predict', name: 'Will it float?', skillIds: ['p-density'], bucket: 'physics', difficulty: 3, variants: 18, minutes: 2.5 },
  (rng, seed) => {
    const mass = [90, 120, 240, 300, 450, 600][seed % 6]
    const volume = [100, 200, 300][Math.floor(seed / 6) % 3]
    const density = Math.round((mass / volume) * 1000) / 1000
    const floats = density < 1
    return {
      title: 'Compare with water',
      prompt: `A block has a mass of **${mass} g** and a volume of **${volume} cm³**. Water has a density of **1 g/cm³**.\n\nWhat is the block's density, and will it float?`,
      answer: mcq(
        rng,
        `${density} g/cm³, so it ${floats ? 'floats' : 'sinks'}`,
        [
          `${density} g/cm³, so it ${floats ? 'sinks' : 'floats'}`,
          `${Math.round((volume / mass) * 1000) / 1000} g/cm³, so it ${floats ? 'sinks' : 'floats'}`,
          `${mass - volume} g/cm³, so it ${floats ? 'floats' : 'sinks'}`,
        ],
      ),
      hints: [
        'Density is mass per unit volume — divide, and mind which way round.',
        `${mass} ÷ ${volume} = ${density} g/cm³.`,
        `Compare with water at 1 g/cm³: ${density} is ${floats ? 'less' : 'greater'}, so it ${floats ? 'floats' : 'sinks'}.`,
      ],
      explanation: `Density = mass ÷ volume = ${mass} ÷ ${volume} = **${density} g/cm³**, which is ${floats ? 'less' : 'greater'} than water's 1 g/cm³, so it **${floats ? 'floats' : 'sinks'}**.\n\nFloating is a comparison, not a property of being heavy: a huge steel ship floats and a small pebble sinks. What matters is mass per unit volume against the fluid it sits in.`,
      commonErrors: {
        representation: `Dividing volume by mass gives ${Math.round((volume / mass) * 1000) / 1000}, which has the units upside down.`,
      },
    }
  },
)

const circuitCurrent = tpl(
  { id: 'phy-ohm-solve', name: 'Ohm’s law, rearranged', skillIds: ['p-circuits'], bucket: 'physics', difficulty: 3, variants: 24, minutes: 2.5 },
  (_rng, seed) => {
    const I = [2, 3, 4, 5][seed % 4]
    const R = [3, 6, 10, 12, 20, 25][Math.floor(seed / 4) % 6]
    const V = I * R
    const askFor = seed % 2 === 0 ? 'current' : 'resistance'
    return {
      title: 'Solve for the missing quantity',
      prompt:
        askFor === 'current'
          ? `A circuit has a **${V} V** supply across a **${R} Ω** resistor. What current flows, in amps?`
          : `A **${V} V** supply drives **${I} A** through a resistor. What is its resistance, in ohms?`,
      answer: numeric(askFor === 'current' ? I : R),
      hints: [
        'V = IR relates all three; rearrange for the one you need.',
        askFor === 'current' ? 'I = V / R.' : 'R = V / I.',
        askFor === 'current' ? `${V} ÷ ${R} = **${I} A**.` : `${V} ÷ ${I} = **${R} Ω**.`,
      ],
      explanation:
        askFor === 'current'
          ? `I = V/R = ${V}/${R} = **${I} A**.\n\nRearranging V = IR is the whole skill here: the relationship is one equation, and which form you need depends only on which quantity is missing. Checking units is a fast sanity test — volts divided by ohms gives amps.`
          : `R = V/I = ${V}/${I} = **${R} Ω**.\n\nRearranging V = IR is the whole skill here: the relationship is one equation, and which form you need depends only on which quantity is missing. Multiplying instead of dividing gives ${V * I}, which the units immediately rule out.`,
    }
  },
)

export const PHYSICS_DEPTH_TEMPLATES: ItemTemplate[] = [
  kinematics,
  forces,
  energyConversion,
  densityFloat,
  circuitCurrent,
]
