/**
 * LUMIXORA SpeakVerse - AI Feedback API Route
 * POST /api/speakverse/v1/ai/feedback
 * Rate limited to max 20 AI requests/user/hour via sv_ai_usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getTutorFeedback } from '@/lib/ai/tutor-adapter'

const feedbackRequestSchema = z.object({
  activityId: z.string().optional(),
  attemptId: z.string().optional(),
  // Accepts responseText, response object, or learnerText
  responseText: z.string().optional(),
  response: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  learnerText: z.string().optional(),
  level: z.string().default('B1'),
  preferTelugu: z.boolean().default(false),
  objective: z.string().optional(),
  activityType: z.string().optional(),
  mistakes: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = feedbackRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const {
      activityId,
      attemptId,
      responseText,
      response,
      learnerText,
      level,
      preferTelugu,
      mistakes,
    } = parsed.data

    // Extract raw learner text from multiple possible client formats
    let resolvedText = ''
    if (learnerText && learnerText.trim()) {
      resolvedText = learnerText.trim()
    } else if (responseText && responseText.trim()) {
      resolvedText = responseText.trim()
    } else if (typeof response === 'string' && response.trim()) {
      resolvedText = response.trim()
    } else if (response && typeof response === 'object' && 'text' in response && typeof response.text === 'string') {
      resolvedText = response.text.trim()
    }

    if (!resolvedText) {
      return NextResponse.json(
        { error: 'Bad Request: Response text cannot be empty' },
        { status: 400 }
      )
    }

    // Ownership check on attempt if provided
    if (attemptId) {
      const attempt = await prisma.svActivityAttempt.findUnique({
        where: { id: attemptId },
        select: { userId: true },
      })
      if (attempt && attempt.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden: Attempt ownership mismatch' }, { status: 403 })
      }
    }

    // Check rate limit: max 20 AI requests per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentAiUsageCount = await prisma.svAiUsage.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentAiUsageCount >= 20) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 20 AI requests per hour reached.',
          retryAfterSeconds: 3600,
        },
        { status: 429 }
      )
    }

    // Resolve objective and activityType from DB if activityId provided
    let activityObjective = parsed.data.objective || 'Sentence formation and spoken clarity'
    let resolvedActivityType = parsed.data.activityType || 'short_writing'

    if (activityId) {
      const activity = await prisma.svActivity.findUnique({
        where: { id: activityId },
        select: {
          activityType: true,
          lesson: { select: { objective: true } },
        },
      })
      if (activity) {
        resolvedActivityType = activity.activityType
        if (activity.lesson?.objective) {
          activityObjective = activity.lesson.objective
        }
      }
    }

    // Call Tutor Adapter
    const feedback = await getTutorFeedback({
      learnerText: resolvedText,
      activityType: resolvedActivityType,
      objective: activityObjective,
      level,
      preferTelugu,
      mistakes,
      userId,
    })

    return NextResponse.json(feedback)
  } catch (err: any) {
    console.error('Error in /api/speakverse/v1/ai/feedback:', err)
    return NextResponse.json(
      { error: 'Internal Server Error processing AI feedback', message: err?.message },
      { status: 500 }
    )
  }
}
