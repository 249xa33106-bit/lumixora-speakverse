/**
 * LUMIXORA SpeakVerse - Telugu Scaffolding API Route
 * POST /api/speakverse/v1/ai/telugu
 * Auth required; provides bilingual pedagogical explanations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getTeluguExplanation } from '@/lib/ai/telugu-adapter'

const teluguRequestSchema = z.object({
  concept: z.string().min(1, 'Concept is required'),
  level: z.string().default('B1'),
  example: z.string().min(1, 'Example sentence is required'),
  misconception: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = teluguRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Rate limiting: max 20 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsage = await prisma.svAiUsage.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (recentUsage >= 20) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 20 AI requests per hour reached.',
          retryAfterSeconds: 3600,
        },
        { status: 429 }
      )
    }

    const explanation = await getTeluguExplanation({
      concept: parsed.data.concept,
      level: parsed.data.level,
      example: parsed.data.example,
      misconception: parsed.data.misconception,
      userId,
    })

    return NextResponse.json(explanation)
  } catch (err: any) {
    console.error('Error in /api/speakverse/v1/ai/telugu:', err)
    return NextResponse.json(
      { error: 'Internal Server Error processing Telugu explanation', message: err?.message },
      { status: 500 }
    )
  }
}
