/**
 * The safety boundaries are content law — and nothing was checking them.
 *
 * CLAUDE.md rule 7 and the founding brief §6 state the strictest rules in the
 * product: Observer and Human Insight teach influence DEFENCE and never
 * operational manipulation; danger-adjacent scenarios break the game frame and
 * point to a trusted adult or emergency resource; no IQ number; no
 * microexpression lie-detection; no learning styles.
 *
 * Every other content rule in this app has a release gate — computed answers,
 * variant honesty, transfer reachability, entry points, unsupported markup,
 * benign-answer coverage. The one the brief calls LAW, and the one with the
 * highest stakes for a teenage user, was enforced by nobody. This is that gate.
 *
 * ## What it found: nothing, twice, and that is the finding
 *
 * Two earlier versions of this check reported the app's best safety content as
 * non-compliant. Both were the detector's fault:
 *
 *  - The first looked for "trusted adult" and missed "teacher or parent",
 *    "responsible adult", "emergency help" and "school authority" — flagging
 *    `h-trusted-person`, whose correct answers name 988 and 911.
 *  - The second matched the generic hint text that lists risks ("when threats,
 *    self-harm or stalking appear…"), which is present on EVERY variant of a
 *    family including the deliberately benign one, and so reported five
 *    compliant renders as bare.
 *
 * Corrected, all fourteen danger-adjacent scenarios in the bank already carry
 * an escalation route. The content was right; the value here is that it stays
 * right when someone adds an Insight scenario in a hurry.
 *
 * The matchers are therefore scoped deliberately: DANGER reads the SCENARIO the
 * learner reasons about, never the coaching around it, and POINTER accepts any
 * real-world escalation route rather than one house phrase.
 */
import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES } from './registry'
import { KB_CARDS } from './kb'
import type { RenderedItem } from '../domain/types'

const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7, 11, 17]

/** The situation posed to the learner — prompt and study text only. */
function scenarioText(item: RenderedItem): string {
  const out = [item.prompt, item.title]
  for (const part of item.parts ?? []) out.push(part.prompt, part.study ?? '')
  return out.filter(Boolean).join('\n')
}

/** Everything the learner can read, including answers and explanation. */
function allText(item: RenderedItem): string {
  const out = [item.prompt, item.explanation, item.title, ...item.hints]
  for (const part of item.parts ?? []) out.push(part.prompt, part.explanation, part.study ?? '', ...(part.hints ?? []))
  const specs = item.parts?.length ? item.parts.map((p) => p.answer) : item.answer ? [item.answer] : []
  for (const spec of specs) {
    if (spec.type === 'mcq' || spec.type === 'multi' || spec.type === 'order') out.push(...spec.options)
    if (spec.type === 'classify') out.push(...spec.statements.map((s) => s.text))
    if (spec.type === 'draft') out.push(spec.model, ...spec.criteria)
    if (spec.type === 'text') out.push(...spec.accept)
  }
  if (item.distractorNotes) out.push(...Object.values(item.distractorNotes))
  return out.filter(Boolean).join('\n')
}

const DANGER =
  /\b(self[- ]harm|hurt themsel|hurt himself|hurt herself|suicid|may hurt them|threatens? to (share|hurt|disappear)|threatening messages?|private photos|demands secrecy|follows you|impaired|blocks the doorway|humiliating image|feels unsafe)/i

const POINTER =
  /\b(adult|guardian|parent|teacher|emergency|988|911|helpline|crisis|authority|authorities|police|report(ing|ed)? (it|them|the)|trusted (person|help)|someone you trust|staffed public place)/i

/**
 * Instruction, not vocabulary. Defensive content has to NAME these tactics to
 * teach recognition, so matching the words alone would flag the very content
 * the rule exists to protect. What is forbidden is the imperative voice —
 * telling the learner how to do it to someone.
 */
const INSTRUCTION = new RegExp(
  String.raw`\b(?:you can|you should|how to|here is how to|the trick is to|try to)\s+` +
    String.raw`(?:make (?:them|him|her|people) (?:feel|believe|doubt|think)|` +
    String.raw`isolate (?:them|him|her)|guilt[- ]trip|love[- ]bomb|gaslight|groom\b|` +
    String.raw`blackmail|manipulate (?:them|him|her|people)|pressure (?:them|him|her) into)`,
  'i',
)

/** Claims the neuromyth table (RESEARCH.md §12) says the app never makes. */
const BANNED_CLAIM = new RegExp(
  String.raw`\b(your IQ|IQ score|IQ points|raises? your intelligence|` +
    String.raw`learning style|left[- ]brained|right[- ]brained|10% of your brain|` +
    String.raw`microexpressions? (?:reveal|show|betray|prove))`,
  'i',
)

interface Render {
  id: string
  scenario: string
  text: string
}

function everyRender(): Render[] {
  const out: Render[] = []
  for (const template of BUILTIN_TEMPLATES) {
    for (const seed of SEEDS) {
      let item: RenderedItem
      try {
        item = template.generate(seed)
      } catch {
        continue
      }
      out.push({ id: `${template.id}@${seed}`, scenario: scenarioText(item), text: allText(item) })
    }
  }
  return out
}

const RENDERS = everyRender()

describe('the safety boundaries are content law', () => {
  /**
   * A matcher that no longer matches anything is indistinguishable from a
   * clean bank, and this file exists precisely because nothing was watching.
   * Two earlier drafts of these regexes were WRONG in the other direction —
   * flagging compliant content — so they are pinned against known-bad and
   * known-good strings rather than trusted.
   */
  it('the matchers still work', () => {
    expect(DANGER.test('A friend says they may hurt themselves tonight.')).toBe(true)
    expect(DANGER.test('Which display best answers that question?')).toBe(false)

    expect(POINTER.test('tell a trusted adult now')).toBe(true)
    expect(POINTER.test('get a responsible adult or emergency help immediately')).toBe(true)
    expect(POINTER.test('contact a trusted person or emergency help')).toBe(true)
    expect(POINTER.test('involve a trusted adult or school authority')).toBe(true)
    expect(POINTER.test('Stop replying and handle it by yourself.')).toBe(false)

    // Recognition must pass; instruction must not.
    expect(INSTRUCTION.test('Notice when someone tries to make you feel guilty for saying no.')).toBe(false)
    expect(INSTRUCTION.test('Guilt-tripping is a pressure tactic worth naming.')).toBe(false)
    expect(INSTRUCTION.test('Here is how to make them feel guilty enough to agree.')).toBe(true)
    expect(INSTRUCTION.test('You can isolate them from their friends first.')).toBe(true)

    expect(BANNED_CLAIM.test('This raises your intelligence.')).toBe(true)
    expect(BANNED_CLAIM.test('Match the work to your learning style.')).toBe(true)
    expect(BANNED_CLAIM.test('Microexpressions reveal when someone is lying.')).toBe(true)
    // …but the app is allowed to name the myth in order to refuse it.
    expect(BANNED_CLAIM.test('Lie-detection accuracy sits near 54%, barely above chance.')).toBe(false)
  })

  it('every danger-adjacent scenario offers a real-world escalation route', () => {
    const bare = RENDERS.filter((r) => DANGER.test(r.scenario) && !POINTER.test(r.text)).map(
      (r) => `${r.id}: ${r.scenario.slice(0, 110).replace(/\n/g, ' ')}`,
    )
    expect(
      bare,
      `these scenarios raise real danger and name nowhere to turn:\n${bare.join('\n')}`,
    ).toEqual([])
  })

  it('finds danger-adjacent scenarios at all, so the check cannot pass vacuously', () => {
    // A gate that matches nothing is indistinguishable from a gate that works.
    const found = RENDERS.filter((r) => DANGER.test(r.scenario))
    expect(found.length, 'the danger matcher found nothing — it has probably rotted').toBeGreaterThan(5)
  })

  it('never instructs the learner in a manipulation technique', () => {
    const teaching = RENDERS.filter((r) => INSTRUCTION.test(r.text)).map((r) => {
      const at = r.text.search(INSTRUCTION)
      return `${r.id}: …${r.text.slice(Math.max(0, at - 60), at + 90).replace(/\n/g, ' ')}…`
    })
    expect(teaching, `operational instruction found:\n${teaching.join('\n')}`).toEqual([])
  })

  it('makes none of the claims the neuromyth table refuses', () => {
    const offenders: string[] = []
    for (const r of RENDERS) {
      if (!BANNED_CLAIM.test(r.text)) continue
      const at = r.text.search(BANNED_CLAIM)
      offenders.push(`${r.id}: …${r.text.slice(Math.max(0, at - 70), at + 90).replace(/\n/g, ' ')}…`)
    }
    for (const card of KB_CARDS) {
      const json = JSON.stringify(card)
      if (BANNED_CLAIM.test(json)) offenders.push(`kb:${card.skillId}`)
    }
    // Deduped by template — one generator repeats itself across seeds.
    const byTemplate = [...new Map(offenders.map((o) => [o.split('@')[0], o])).values()]
    expect(byTemplate, `banned claims reach the learner:\n${byTemplate.join('\n')}`).toEqual([])
  })
})
