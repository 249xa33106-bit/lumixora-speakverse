/**
 * LUMIXORA SpeakVerse - Progress Overview API
 * GET /api/speakverse/v1/progress/overview
 * Aggregates sv_skill_evidence, sv_activity_attempts, sv_lesson_progress, sv_revision_items
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

const ALL_SKILLS = ['grammar', 'vocabulary', 'speaking', 'listening', 'writing', 'interview'] as const

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Fetch Skill Evidence
    const allEvidence = await prisma.svSkillEvidence.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })

    const skillScores: Record<string, { initial: number; recent: number; count: number }> = {}

    for (const skill of ALL_SKILLS) {
      const items = allEvidence.filter((e) => e.skill.toLowerCase() === skill)
      if (items.length === 0) {
        // Formative baseline values for beginners
        skillScores[skill] = { initial: 50, recent: 60, count: 0 }
      } else {
        const initial = Math.round((items[0].score / items[0].maxScore) * 100)
        const recentItems = items.slice(-5)
        const recentAvg = Math.round(
          (recentItems.reduce((acc, curr) => acc + curr.score / curr.maxScore, 0) / recentItems.length) * 100
        )
        skillScores[skill] = {
          initial: Math.min(100, Math.max(0, initial)),
          recent: Math.min(100, Math.max(0, recentAvg)),
          count: items.length,
        }
      }
    }

    // 2. Practice Frequency: Last 4 weeks session count
    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)

    const userSessions = await prisma.svSession.findMany({
      where: {
        userId,
        startedAt: { gte: fourWeeksAgo },
      },
      select: { startedAt: true },
    })

    const userAttempts = await prisma.svActivityAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: fourWeeksAgo },
      },
      select: { createdAt: true },
    })

    // Group by week (Week 1 = 3 weeks ago, Week 4 = this week)
    const weeklyFrequency = [
      { week: 'Week 1', label: '3 weeks ago', count: 0 },
      { week: 'Week 2', label: '2 weeks ago', count: 0 },
      { week: 'Week 3', label: 'Last week', count: 0 },
      { week: 'Week 4', label: 'This week', count: 0 },
    ]

    const allTimestamps = [
      ...userSessions.map((s) => s.startedAt.getTime()),
      ...userAttempts.map((a) => a.createdAt.getTime()),
    ]

    allTimestamps.forEach((ts) => {
      const daysAgo = Math.floor((now.getTime() - ts) / (24 * 60 * 60 * 1000))
      if (daysAgo >= 21 && daysAgo < 28) weeklyFrequency[0].count++
      else if (daysAgo >= 14 && daysAgo < 21) weeklyFrequency[1].count++
      else if (daysAgo >= 7 && daysAgo < 14) weeklyFrequency[2].count++
      else if (daysAgo >= 0 && daysAgo < 7) weeklyFrequency[3].count++
    })

    // 3. Completed Learning Objectives Count
    const completedObjectivesCount = await prisma.svLessonProgress.count({
      where: {
        userId,
        status: 'completed',
      },
    })

    // 4. Recurring Mistakes List (from sv_revision_items grouped by skill)
    const revisionItems = await prisma.svRevisionItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const mistakesBySkill: Record<string, Array<{ id: string; text: string; dueAt: string; status: string }>> = {}
    revisionItems.forEach((rev) => {
      const sk = rev.skill.toLowerCase()
      if (!mistakesBySkill[sk]) mistakesBySkill[sk] = []
      let parsedNote = 'Grammar & word choice pattern'
      try {
        const parsed = JSON.parse(rev.revisionContentJson)
        if (parsed.mistake || parsed.note || parsed.concept || parsed.original) {
          parsedNote = parsed.mistake || parsed.note || parsed.concept || parsed.original
        }
      } catch {
        parsedNote = rev.revisionContentJson.slice(0, 60)
      }
      mistakesBySkill[sk].push({
        id: rev.id,
        text: parsedNote,
        dueAt: rev.dueAt.toISOString(),
        status: rev.status,
      })
    })

    // 5. Revision Schedule: Upcoming due items
    const upcomingRevisions = await prisma.svRevisionItem.findMany({
      where: {
        userId,
        status: { in: ['pending', 'due'] },
      },
      orderBy: { dueAt: 'asc' },
      take: 6,
    })

    // 6. Interview Readiness Profile
    const interviewEvidence = allEvidence.filter((e) => e.skill.toLowerCase() === 'interview')
    const interviewScore = skillScores.interview.recent
    const speakingScore = skillScores.speaking.recent
    const grammarScore = skillScores.grammar.recent

    // Weighted composite readiness index
    const interviewReadinessPct = Math.round(
      interviewScore * 0.5 + speakingScore * 0.3 + grammarScore * 0.2
    )

    let readinessStage = 'Foundation Building'
    if (interviewReadinessPct >= 80) readinessStage = 'Placement Ready'
    else if (interviewReadinessPct >= 65) readinessStage = 'Practicing Intermediate'
    else if (interviewReadinessPct >= 50) readinessStage = 'Developing Communicator'

    return NextResponse.json({
      skills: skillScores,
      weeklyFrequency,
      completedObjectivesCount,
      recurringMistakes: mistakesBySkill,
      upcomingRevisions: upcomingRevisions.map((item) => ({
        id: item.id,
        skill: item.skill,
        dueAt: item.dueAt.toISOString(),
        status: item.status,
        content: (() => {
          try {
            return JSON.parse(item.revisionContentJson)
          } catch {
            return { note: item.revisionContentJson }
          }
        })(),
      })),
      interviewReadiness: {
        percentage: interviewReadinessPct,
        stage: readinessStage,
        interviewEvidenceCount: interviewEvidence.length,
        disclaimer: 'Formative AI estimation based on practice sessions; not an accredited certification or guaranteed placement outcome.',
      },
    })
  } catch (error: any) {
    console.error('Error fetching progress overview:', error)
    return NextResponse.json(
      { error: 'Internal Server Error fetching progress', message: error?.message },
      { status: 500 }
    )
  }
}
