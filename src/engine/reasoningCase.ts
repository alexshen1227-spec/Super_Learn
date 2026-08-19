import type { ReasoningCase, ReasoningCaseKind } from '../domain/types'

export type ReasoningAuditTone = 'good' | 'warn' | 'neutral'

export interface ReasoningAudit {
  id: string
  tone: ReasoningAuditTone
  title: string
  detail: string
}

const INFERENCE_WORDS = /\b(probably|clearly|obviously|must|means|seems|thinks?|wanted|because|therefore|so that)\b/i

export const RIVAL_PROMPTS: Record<ReasoningCaseKind, string[]> = {
  claim: [
    'What would I expect to see if the opposite were true?',
    'Could selection, timing, or missing context create the same pattern?',
    'What base rate should this claim start from?',
  ],
  decision: [
    'What is the smallest reversible version of this choice?',
    'What is the cost of waiting, and the cost of acting too soon?',
    'Which option would I choose if the first option disappeared?',
  ],
  explanation: [
    'What else predicts the same observations?',
    'Could the direction of cause run the other way?',
    'What common cause could produce both things?',
  ],
}

export function splitReasoningLines(value: string, maxItems = 8, maxLen = 500): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((line) => line.slice(0, maxLen))
}

export function reasoningCaseCompleteness(value: ReasoningCase): number {
  const checks = [
    value.question.trim().length >= 8,
    value.observations.length > 0,
    value.inferences.length > 0,
    value.alternatives.length >= 2,
    value.assumptions.length > 0,
    value.disconfirmingTest.trim().length >= 8,
    value.conclusion.trim().length >= 8,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function reasoningCaseBlockers(value: ReasoningCase): string[] {
  const blockers: string[] = []
  if (value.question.trim().length < 8) blockers.push('Frame a specific question.')
  if (!value.observations.length) blockers.push('Add at least one directly checkable observation.')
  if (!value.inferences.length) blockers.push('Name at least one interpretation you are drawing.')
  if (value.alternatives.length < 2) blockers.push('Keep at least two live alternatives.')
  if (!value.assumptions.length) blockers.push('Expose at least one assumption.')
  if (value.disconfirmingTest.trim().length < 8) blockers.push('Choose a check that could change your mind.')
  if (value.conclusion.trim().length < 8) blockers.push('Write the conclusion or next move you will commit to.')
  return blockers
}

/**
 * Local, deterministic friction checks. This does not judge whether the
 * learner is right; it checks whether the reasoning has the structural pieces
 * needed to be inspectable and revisable.
 */
export function auditReasoningCase(value: ReasoningCase): ReasoningAudit[] {
  const out: ReasoningAudit[] = []
  const inferenceLike = value.observations.filter((line) => INFERENCE_WORDS.test(line))

  if (inferenceLike.length) {
    out.push({
      id: 'observation-inference',
      tone: 'warn',
      title: 'An observation may contain an interpretation',
      detail: `Recheck: “${inferenceLike[0]}”. Could a camera, receipt, or direct quote capture it as written?`,
    })
  } else if (value.observations.length >= 2) {
    out.push({
      id: 'observations-separated',
      tone: 'good',
      title: 'Facts are separated from the story',
      detail: `${value.observations.length} observations are kept distinct from your interpretations.`,
    })
  }

  if (value.alternatives.length < 2) {
    out.push({
      id: 'one-story',
      tone: 'warn',
      title: 'One-story lock-in',
      detail: 'Keep a rival explanation or option alive long enough to compare what each predicts.',
    })
  } else {
    out.push({
      id: 'rivals',
      tone: 'good',
      title: 'Rival alternatives are live',
      detail: `You can compare ${value.alternatives.length} possibilities instead of only defending the first one.`,
    })
  }

  if (!value.disconfirmingTest.trim()) {
    out.push({
      id: 'no-test',
      tone: 'warn',
      title: 'Nothing can change the conclusion yet',
      detail: 'Name the next observation that would favor one alternative over another.',
    })
  } else {
    out.push({
      id: 'test',
      tone: 'good',
      title: 'The reasoning can be revised',
      detail: 'You named a check before seeing its result, which protects it from hindsight editing.',
    })
  }

  if (value.confidence >= 80 && (value.observations.length < 2 || value.alternatives.length < 2)) {
    out.push({
      id: 'confidence-ahead',
      tone: 'warn',
      title: 'Confidence is ahead of the structure',
      detail: 'High confidence is expensive here: add another observation and a genuine rival before committing above 80%.',
    })
  } else if (value.conclusion.trim()) {
    out.push({
      id: 'calibrated-commitment',
      tone: 'neutral',
      title: `Commitment: ${value.confidence}%`,
      detail: 'This is a timestamped estimate, not a score. Resolve the case later against what happened.',
    })
  }

  return out
}

