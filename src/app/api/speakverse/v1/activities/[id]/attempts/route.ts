import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { gradeActivity } from '@/lib/learning/grader'
import { scheduleRevision } from '@/lib/learning/spaced-repetition'

const attemptSchema = z.object({
  attemptId: z.string().max(100), // client-generated idempotency key
  response: z.object({
    type: z.string(),
  }).passthrough(),
  hintsUsed: z.number().int().min(0).default(0),
  contentVersion: z.number().int().min(1),
})

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await Promise.resolve(props.params)
  const activityId = params.id

  const body = await req.json()
  const parsed = attemptSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Idempotency: check if attempt already exists
  const existing = await prisma.svActivityAttempt.findUnique({
    where: { idempotencyKey: parsed.data.attemptId },
  })
  if (existing) {
    return NextResponse.json({
      attemptId: existing.id,
      status: 'graded',
      score: existing.score,
      maxScore: existing.maxScore,
      feedback: existing.feedbackJson ? JSON.parse(existing.feedbackJson) : null,
    })
  }

  // Verify activity exists
  const activity = await prisma.svActivity.findUnique({
    where: { id: activityId },
    select: { id: true, skill: true, lessonId: true, scoringConfig: true },
  })
  if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })

  // Count previous attempts
  const prevAttempts = await prisma.svActivityAttempt.count({
    where: { userId: session.user.id, activityId },
  })

  // Grade the activity
  const gradeResult = await gradeActivity(
    activityId,
    parsed.data.response as any,
    parsed.data.hintsUsed
  )

  // Get feedback text from activity
  const activityContent = await prisma.svActivity.findUnique({
    where: { id: activityId },
    select: { contentJson: true, instructionsI18n: true },
  })
  const content = activityContent?.contentJson ? JSON.parse(activityContent.contentJson) : {}
  const feedback = content.feedback ? {
    summary: gradeResult.correct ? content.feedback.correct : content.feedback.incorrect,
    nextAction: gradeResult.correct ? 'Great work! Continue to the next activity.' : 'Try again with a hint if needed.',
  } : null

  // Save attempt
  const attempt = await prisma.svActivityAttempt.create({
    data: {
      idempotencyKey: parsed.data.attemptId,
      userId: session.user.id,
      activityId,
      contentVersion: parsed.data.contentVersion,
      responseJson: JSON.stringify(parsed.data.response),
      score: gradeResult.score,
      maxScore: gradeResult.maxScore,
      feedbackJson: feedback ? JSON.stringify(feedback) : null,
      attemptNumber: prevAttempts + 1,
      hintCount: parsed.data.hintsUsed,
    },
  })

  // Save skill evidence
  await prisma.svSkillEvidence.create({
    data: {
      userId: session.user.id,
      skill: activity.skill,
      evidenceType: 'activity_attempt',
      sourceAttemptId: attempt.id,
      rubricVersion: JSON.parse(activity.scoringConfig).rubricVersion ?? '1.0',
      score: gradeResult.score,
      maxScore: gradeResult.maxScore,
    },
  })

  // Schedule spaced revision if relevant
  if (parsed.data.response.type !== 'short_writing' && parsed.data.response.type !== 'spoken_response') {
    await scheduleRevision(
      session.user.id,
      attempt.id,
      activity.skill,
      { activityId, lessonId: activity.lessonId },
      {
        correct: gradeResult.correct,
        usedHint: parsed.data.hintsUsed > 0,
        consecutiveCorrect: gradeResult.correct ? 1 : 0,
      }
    )
  }

  return NextResponse.json({
    attemptId: attempt.id,
    status: 'graded',
    score: gradeResult.score,
    maxScore: gradeResult.maxScore,
    correct: gradeResult.correct,
    feedback,
  })
}
