import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'
import { computeRecommendations, getSkillSummaries } from '@/lib/learning/recommendation-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const [profile, skillSummaries, recommendations, recentProgress, dueRevisions] = await Promise.all([
    prisma.svProfile.findUnique({ where: { userId } }),
    getSkillSummaries(userId),
    computeRecommendations(userId),
    prisma.svLessonProgress.findMany({
      where: { userId },
      include: { lesson: { select: { title: true, skill: true, estimatedMinutes: true } } },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    }),
    prisma.svRevisionItem.count({
      where: { userId, status: 'pending', dueAt: { lte: new Date() } },
    }),
  ])

  return NextResponse.json({
    profile,
    skillSummaries,
    recommendations,
    recentProgress,
    dueRevisions,
  })
}
