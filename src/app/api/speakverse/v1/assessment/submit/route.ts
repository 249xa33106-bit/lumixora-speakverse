import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const assessmentSubmitSchema = z.object({
  scores: z.object({
    grammar: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
    reading: z.number().min(0).max(100),
    listening: z.number().min(0).max(100),
    writing: z.number().min(0).max(100),
    speaking: z.number().min(0).max(100),
  }),
  level: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = assessmentSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid assessment payload' }, { status: 400 })
  }

  const userId = session.user.id
  const { scores, level } = parsed.data

  // Save skill evidence for each skill tested
  for (const [skill, score] of Object.entries(scores)) {
    await prisma.svSkillEvidence.create({
      data: {
        userId,
        skill,
        evidenceType: 'assessment',
        rubricVersion: '1.0',
        score,
        maxScore: 100,
        confidence: 0.85,
      },
    })
  }

  // Update learner profile
  await prisma.svProfile.update({
    where: { userId },
    data: {
      assessmentComplete: true,
      selfAssessedLevel: level,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Assessment completed and skills recorded',
    level,
    scores,
  })
}
