/**
 * LUMIXORA SpeakVerse - Achievements API
 * GET /api/speakverse/v1/achievements
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user progress and evidence
    const completedLessons = await prisma.svLessonProgress.count({
      where: { userId, status: 'completed' },
    })

    const completedInterviews = await prisma.svSession.count({
      where: { userId, sessionType: 'mock_interview', status: 'completed' },
    })

    const attemptCount = await prisma.svActivityAttempt.count({
      where: { userId },
    })

    const grammarEvidence = await prisma.svSkillEvidence.findMany({
      where: { userId, skill: 'grammar' },
    })

    const avgGrammarScore = grammarEvidence.length > 0
      ? grammarEvidence.reduce((sum, e) => sum + (e.score / e.maxScore), 0) / grammarEvidence.length
      : 0

    const enrollments = await prisma.svEnrollment.findMany({
      where: { userId },
      include: { course: true },
    })

    // Define Milestone Badges
    const milestones = [
      {
        id: 'first-lesson',
        title: 'First Step Taken',
        description: 'Complete your first curriculum lesson in SpeakVerse.',
        unlocked: completedLessons >= 1,
        progress: Math.min(1, completedLessons),
        max: 1,
        icon: 'BookOpen',
        category: 'Learning',
        unlockedAt: completedLessons >= 1 ? 'Recent' : null,
      },
      {
        id: 'streak-7',
        title: '7-Day Practice Streak',
        description: 'Practice consistently across multiple learning days.',
        unlocked: attemptCount >= 7,
        progress: Math.min(7, attemptCount),
        max: 7,
        icon: 'Flame',
        category: 'Consistency',
        unlockedAt: attemptCount >= 7 ? 'Recent' : null,
      },
      {
        id: 'first-interview',
        title: 'First Mock Interview',
        description: 'Complete a full simulation round in the Interview Arena.',
        unlocked: completedInterviews >= 1,
        progress: Math.min(1, completedInterviews),
        max: 1,
        icon: 'GraduationCap',
        category: 'Interview',
        unlockedAt: completedInterviews >= 1 ? 'Recent' : null,
      },
      {
        id: 'grammar-master',
        title: 'Grammar Master',
        description: 'Demonstrate over 80% average accuracy across grammar exercises.',
        unlocked: grammarEvidence.length >= 3 && avgGrammarScore >= 0.8,
        progress: Math.min(3, grammarEvidence.length),
        max: 3,
        icon: 'Sparkles',
        category: 'Accuracy',
        unlockedAt: grammarEvidence.length >= 3 && avgGrammarScore >= 0.8 ? 'Recent' : null,
      },
      {
        id: 'fluency-builder',
        title: 'Fluency Builder',
        description: 'Complete 10 interactive learning activities.',
        unlocked: attemptCount >= 10,
        progress: Math.min(10, attemptCount),
        max: 10,
        icon: 'Zap',
        category: 'Engagement',
        unlockedAt: attemptCount >= 10 ? 'Recent' : null,
      },
    ]

    // Certificates section
    // Completed courses or default milestone certificate
    const certificates = enrollments
      .filter((e) => e.status === 'completed')
      .map((e) => ({
        id: e.id,
        courseTitle: e.course.title,
        issuedDate: e.enrolledAt.toISOString().split('T')[0],
        assessedSkills: ['Spoken Intelligibility', 'Grammar in Context', 'Professional Dialogue'],
        level: e.course.targetLevel || 'B1',
      }))

    // If student has completed 5 or more lessons, grant the Foundation Milestone Certificate
    if (completedLessons >= 1 && certificates.length === 0) {
      certificates.push({
        id: 'cert-foundation',
        courseTitle: 'Foundational English Communication Module',
        issuedDate: new Date().toISOString().split('T')[0],
        assessedSkills: ['Sentence Structure', 'Conversational Confidence', 'Interview Introduction'],
        level: 'B1',
      })
    }

    return NextResponse.json({
      milestones,
      certificates,
      stats: {
        completedLessons,
        completedInterviews,
        attemptCount,
      },
    })
  } catch (err: any) {
    console.error('Error in achievements API:', err)
    return NextResponse.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    )
  }
}
