/**
 * Simple spaced repetition intervals (configurable).
 * Policy: as per spec §10.
 */

export interface ReviewResult {
  correct: boolean
  usedHint: boolean
  consecutiveCorrect: number
}

/**
 * Calculate next review date based on performance.
 * Returns Date of next review.
 */
export function calculateNextReview(result: ReviewResult, currentInterval?: number): Date {
  const now = new Date()
  let intervalDays: number

  if (!result.correct) {
    // Incorrect: retry soon (same day or next day)
    intervalDays = 0.5 // 12 hours
  } else if (result.usedHint) {
    // Correct with hint: shorter interval
    intervalDays = 2
  } else if (!currentInterval) {
    // First correct attempt
    intervalDays = 4
  } else if (result.consecutiveCorrect >= 3) {
    // Repeated success: extend interval (max 30 days)
    intervalDays = Math.min(currentInterval * 2.5, 30)
  } else {
    intervalDays = currentInterval * 1.5
  }

  const nextDate = new Date(now)
  nextDate.setTime(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)
  return nextDate
}

/**
 * Schedule a revision item after an attempt.
 */
export async function scheduleRevision(
  userId: string,
  attemptId: string,
  skill: string,
  revisionContent: Record<string, unknown>,
  result: ReviewResult,
  currentInterval?: number
) {
  const { prisma } = await import('@/lib/db/client')
  const dueAt = calculateNextReview(result, currentInterval)

  await prisma.svRevisionItem.create({
    data: {
      userId,
      sourceAttemptId: attemptId,
      skill,
      revisionContentJson: JSON.stringify(revisionContent),
      dueAt,
      status: 'pending',
    },
  })
}
