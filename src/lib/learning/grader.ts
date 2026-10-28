/**
 * Server-side activity grader.
 * Answer keys are NEVER exposed to clients.
 * Only imported in API routes and server actions.
 */

import { prisma } from '@/lib/db/client'

export interface GradeResult {
  score: number
  maxScore: number
  correct: boolean
  feedbackKey: 'correct' | 'incorrect' | 'partial'
  hintPenaltyApplied: number
}

export type ActivityResponse =
  | { type: 'sentence_reorder'; tokens: string[] }
  | { type: 'single_choice'; selectedId: string }
  | { type: 'multi_select'; selectedIds: string[] }
  | { type: 'fill_blank'; answer: string }
  | { type: 'error_correction'; original: string; corrected: string }
  | { type: 'listening_mcq'; selectedId: string }
  | { type: 'dictation'; transcribed: string }
  | { type: 'short_writing'; text: string }
  | { type: 'spoken_response'; transcriptText: string; transcriptConfidence: number }

export async function gradeActivity(
  activityId: string,
  response: ActivityResponse,
  hintsUsed: number
): Promise<GradeResult> {
  const activity = await prisma.svActivity.findUnique({
    where: { id: activityId },
    select: { answerKeyJson: true, scoringConfig: true, activityType: true },
  })

  if (!activity) throw new Error('Activity not found')

  const scoring = JSON.parse(activity.scoringConfig) as {
    maxPoints: number
    hintPenalty: number
    rubricVersion: string
  }

  const answerKey = activity.answerKeyJson ? JSON.parse(activity.answerKeyJson) : null

  let raw: GradeResult = {
    score: 0,
    maxScore: scoring.maxPoints,
    correct: false,
    feedbackKey: 'incorrect',
    hintPenaltyApplied: 0,
  }

  switch (response.type) {
    case 'sentence_reorder': {
      if (!answerKey?.correctOrder) break
      const correct = JSON.stringify(response.tokens) === JSON.stringify(answerKey.correctOrder)
      raw = { ...raw, score: correct ? scoring.maxPoints : 0, correct, feedbackKey: correct ? 'correct' : 'incorrect' }
      break
    }

    case 'single_choice':
    case 'listening_mcq': {
      if (!answerKey?.correctId) break
      const selected = (response as { selectedId: string }).selectedId
      const correct = selected === answerKey.correctId
      raw = { ...raw, score: correct ? scoring.maxPoints : 0, correct, feedbackKey: correct ? 'correct' : 'incorrect' }
      break
    }

    case 'multi_select': {
      if (!answerKey?.correctIds) break
      const correct = new Set<string>(answerKey.correctIds)
      const given = new Set(response.selectedIds)
      const hits = [...correct].filter((id: string) => given.has(id)).length
      const score = Math.round((hits / correct.size) * scoring.maxPoints)
      const isFullyCorrect = hits === correct.size && given.size === correct.size
      raw = { ...raw, score, correct: isFullyCorrect, feedbackKey: isFullyCorrect ? 'correct' : score > 0 ? 'partial' : 'incorrect' }
      break
    }

    case 'fill_blank': {
      if (!answerKey?.acceptedAnswers) break
      const normalized = response.answer.trim().toLowerCase()
      const accepted: string[] = answerKey.acceptedAnswers.map((a: string) => a.trim().toLowerCase())
      const correct = accepted.includes(normalized)
      raw = { ...raw, score: correct ? scoring.maxPoints : 0, correct, feedbackKey: correct ? 'correct' : 'incorrect' }
      break
    }

    case 'dictation': {
      if (!answerKey?.referenceText) break
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      const ref = normalize(answerKey.referenceText)
      const given = normalize(response.transcribed)
      const correct = ref === given
      // Partial credit: word overlap
      const refWords = ref.split(/\s+/)
      const givenWords = given.split(/\s+/)
      const overlap = refWords.filter((w, i) => givenWords[i] === w).length
      const score = correct ? scoring.maxPoints : Math.round((overlap / refWords.length) * scoring.maxPoints)
      raw = { ...raw, score, correct, feedbackKey: correct ? 'correct' : score > 0 ? 'partial' : 'incorrect' }
      break
    }

    case 'error_correction':
    case 'short_writing':
    case 'spoken_response':
      // These require AI/rubric evaluation — default formative credit
      raw = { ...raw, score: scoring.maxPoints * 0.8, correct: true, feedbackKey: 'correct' }
      break
  }

  // Apply hint penalty
  const penalty = Math.min(hintsUsed * scoring.hintPenalty, raw.score)
  raw.score = Math.max(0, raw.score - penalty)
  raw.hintPenaltyApplied = penalty

  return raw
}
