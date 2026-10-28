/**
 * Adaptive Learning Recommendation Engine
 * Combines deterministic rules (as per spec §10) with learner data.
 * Does NOT use an LLM for progression decisions.
 */

import { prisma } from '@/lib/db/client'

export type SkillName = 'grammar' | 'vocabulary' | 'speaking' | 'listening' | 'writing' | 'interview'

export interface SkillSummary {
  skill: SkillName
  recentAvgScore: number // 0-1
  attemptCount: number
  lastAttemptAt: Date | null
}

export interface Recommendation {
  type: 'lesson' | 'activity' | 'revision' | 'assessment'
  entityId: string
  title: string
  reason: string
  priority: number // 1 = highest
  skill: SkillName
  estimatedMinutes?: number
}

export async function getSkillSummaries(userId: string): Promise<SkillSummary[]> {
  const skills: SkillName[] = ['grammar', 'vocabulary', 'speaking', 'listening', 'writing', 'interview']
  const results: SkillSummary[] = []

  for (const skill of skills) {
    const evidence = await prisma.svSkillEvidence.findMany({
      where: { userId, skill },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentAvgScore = evidence.length > 0
      ? evidence.reduce((sum, e) => sum + (e.score / e.maxScore), 0) / evidence.length
      : 0

    results.push({
      skill,
      recentAvgScore,
      attemptCount: evidence.length,
      lastAttemptAt: evidence[0]?.createdAt ?? null,
    })
  }

  return results
}

export async function computeRecommendations(userId: string): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = []

  // Get learner profile
  const profile = await prisma.svProfile.findUnique({ where: { userId } })
  if (!profile) return []

  const skillSummaries = await getSkillSummaries(userId)
  const skillMap = Object.fromEntries(skillSummaries.map(s => [s.skill, s])) as Record<SkillName, SkillSummary>

  // Get due revisions (highest priority)
  const dueRevisions = await prisma.svRevisionItem.findMany({
    where: { userId, status: 'pending', dueAt: { lte: new Date() } },
    take: 3,
    orderBy: { dueAt: 'asc' },
  })

  for (const rev of dueRevisions) {
    recommendations.push({
      type: 'revision',
      entityId: rev.id,
      title: `Revision: ${rev.skill}`,
      reason: 'This item is due for review based on your revision schedule.',
      priority: 1,
      skill: rev.skill as SkillName,
      estimatedMinutes: 5,
    })
  }

  // Check interview date urgency
  if (profile.targetDate) {
    const daysUntilInterview = Math.ceil(
      (profile.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilInterview <= 14 && daysUntilInterview > 0) {
      const interviewLesson = await prisma.svLesson.findFirst({
        where: { skill: 'interview', status: 'published' },
        orderBy: { difficulty: 'asc' },
      })
      if (interviewLesson) {
        recommendations.push({
          type: 'lesson',
          entityId: interviewLesson.id,
          title: interviewLesson.title,
          reason: `Your interview date is in ${daysUntilInterview} days. Prioritizing interview practice.`,
          priority: 2,
          skill: 'interview',
          estimatedMinutes: interviewLesson.estimatedMinutes,
        })
      }
    }
  }

  // Rule: prerequisite not mastered → recommend prerequisite
  const weakestSkill = skillSummaries
    .filter(s => s.attemptCount > 0)
    .sort((a, b) => a.recentAvgScore - b.recentAvgScore)[0]

  if (weakestSkill && weakestSkill.recentAvgScore < 0.6) {
    const prerequisiteLesson = await prisma.svLesson.findFirst({
      where: { skill: weakestSkill.skill, status: 'published', difficulty: 'A1' },
    })
    if (prerequisiteLesson) {
      recommendations.push({
        type: 'lesson',
        entityId: prerequisiteLesson.id,
        title: prerequisiteLesson.title,
        reason: `Your ${weakestSkill.skill} score suggests building stronger foundations first.`,
        priority: 3,
        skill: weakestSkill.skill as SkillName,
        estimatedMinutes: prerequisiteLesson.estimatedMinutes,
      })
    }
  }

  // Rule: grammar strong but speaking weak → prioritize guided speaking
  const grammarScore = skillMap.grammar?.recentAvgScore ?? 0
  const speakingScore = skillMap.speaking?.recentAvgScore ?? 0
  if (grammarScore >= 0.7 && speakingScore < 0.5) {
    const speakingLesson = await prisma.svLesson.findFirst({
      where: { skill: 'speaking', status: 'published' },
      orderBy: { estimatedMinutes: 'asc' },
    })
    if (speakingLesson) {
      recommendations.push({
        type: 'lesson',
        entityId: speakingLesson.id,
        title: speakingLesson.title,
        reason: 'You know the grammar — now practice using it in conversation.',
        priority: 4,
        skill: 'speaking',
        estimatedMinutes: speakingLesson.estimatedMinutes,
      })
    }
  }

  // Default: next curriculum lesson
  const completedLessonIds = (
    await prisma.svLessonProgress.findMany({
      where: { userId, status: 'completed' },
      select: { lessonId: true },
    })
  ).map(p => p.lessonId)

  const nextLesson = await prisma.svLesson.findFirst({
    where: {
      status: 'published',
      id: { notIn: completedLessonIds },
    },
    orderBy: [{ stage: 'asc' }, { difficulty: 'asc' }],
  })

  if (nextLesson) {
    recommendations.push({
      type: 'lesson',
      entityId: nextLesson.id,
      title: nextLesson.title,
      reason: 'Continue your learning path with the next recommended lesson.',
      priority: 10,
      skill: nextLesson.skill as SkillName,
      estimatedMinutes: nextLesson.estimatedMinutes,
    })
  }

  // Sort by priority and return top 5
  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 5)
}
