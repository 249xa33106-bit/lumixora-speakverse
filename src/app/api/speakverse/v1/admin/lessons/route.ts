/**
 * LUMIXORA SpeakVerse - Admin Lessons API
 * GET /api/speakverse/v1/admin/lessons
 * POST /api/speakverse/v1/admin/lessons
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

const AUTHORIZED_ROLES = [
  'admin',
  'administrator',
  'content_editor',
  'content_reviewer',
  'assessment_manager',
  'support_agent',
]

const createLessonSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  skill: z.enum(['grammar', 'vocabulary', 'speaking', 'listening', 'writing', 'interview']),
  difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
  objective: z.string().min(5),
  estimatedMinutes: z.number().int().min(1).default(5),
  status: z.enum(['draft', 'review', 'approved', 'published', 'retired']).default('draft'),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role || 'student'

    if (!session?.user || !AUTHORIZED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: 403' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    const whereClause: any = {}
    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter
    }

    let lessons = await prisma.svLesson.findMany({
      where: whereClause,
      include: {
        module: { select: { title: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // If no lessons exist yet, seed baseline curriculum lessons so table is functional
    if (lessons.length === 0 && !statusFilter) {
      let course = await prisma.svCourse.findFirst()
      if (!course) {
        course = await prisma.svCourse.create({
          data: {
            slug: 'foundations-english',
            title: 'Foundations of Spoken English',
            targetLevel: 'B1',
            status: 'published',
          },
        })
      }

      let moduleItem = await prisma.svModule.findFirst({ where: { courseId: course.id } })
      if (!moduleItem) {
        moduleItem = await prisma.svModule.create({
          data: {
            courseId: course.id,
            title: 'Core Communication & Grammar',
            position: 1,
            status: 'published',
          },
        })
      }

      const seedLessons = [
        {
          moduleId: moduleItem.id,
          slug: 'present-tense-foundations',
          title: 'Present Tenses in Workplace Conversations',
          objective: 'Master simple present vs present continuous for daily updates',
          difficulty: 'A2',
          estimatedMinutes: 5,
          skill: 'grammar',
          status: 'published',
        },
        {
          moduleId: moduleItem.id,
          slug: 'technical-project-intro',
          title: 'Introducing Your Final Year Project',
          objective: 'Structure problem statement and tech stack overview',
          difficulty: 'B1',
          estimatedMinutes: 8,
          skill: 'interview',
          status: 'published',
        },
        {
          moduleId: moduleItem.id,
          slug: 'active-listening-standup',
          title: 'Listening for Key Actions in Stand-ups',
          objective: 'Identify action items and blockers from team audio',
          difficulty: 'B1',
          estimatedMinutes: 6,
          skill: 'listening',
          status: 'review',
        },
        {
          moduleId: moduleItem.id,
          slug: 'action-verbs-collocations',
          title: 'Impactful Verbs for Resumes & Pitches',
          objective: 'Replace weak verbs with action-driven collocations',
          difficulty: 'B2',
          estimatedMinutes: 5,
          skill: 'vocabulary',
          status: 'approved',
        },
        {
          moduleId: moduleItem.id,
          slug: 'persuasive-email-writing',
          title: 'Formal Emails & Proposals',
          objective: 'Write concise project requests without colloquialisms',
          difficulty: 'B2',
          estimatedMinutes: 10,
          skill: 'writing',
          status: 'draft',
        },
        {
          moduleId: moduleItem.id,
          slug: 'legacy-intro-lesson',
          title: 'Everyday Greetings (Legacy Version)',
          objective: 'Basic introductions',
          difficulty: 'A1',
          estimatedMinutes: 5,
          skill: 'speaking',
          status: 'retired',
        },
      ]

      for (const item of seedLessons) {
        await prisma.svLesson.create({ data: item })
      }

      lessons = await prisma.svLesson.findMany({
        where: whereClause,
        include: {
          module: { select: { title: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }

    return NextResponse.json(lessons)
  } catch (err: any) {
    console.error('Error in admin lessons API:', err)
    return NextResponse.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role || 'student'

    if (!session?.user || !AUTHORIZED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: 403' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createLessonSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 })
    }

    // Ensure a course & module exists
    let moduleItem = await prisma.svModule.findFirst()
    if (!moduleItem) {
      let course = await prisma.svCourse.findFirst()
      if (!course) {
        course = await prisma.svCourse.create({
          data: {
            slug: 'foundations-english',
            title: 'Foundations of Spoken English',
            targetLevel: 'B1',
            status: 'published',
          },
        })
      }
      moduleItem = await prisma.svModule.create({
        data: {
          courseId: course.id,
          title: 'Core Curriculum Module',
          position: 1,
          status: 'published',
        },
      })
    }

    const lesson = await prisma.svLesson.create({
      data: {
        moduleId: moduleItem.id,
        slug: parsed.data.slug,
        title: parsed.data.title,
        skill: parsed.data.skill,
        difficulty: parsed.data.difficulty,
        objective: parsed.data.objective,
        estimatedMinutes: parsed.data.estimatedMinutes,
        status: parsed.data.status,
      },
    })

    // Log to sv_audit_logs
    try {
      await prisma.svAuditLog.create({
        data: {
          userId: session.user.id,
          action: 'lesson_created',
          entityType: 'lesson',
          entityId: lesson.id,
          details: JSON.stringify({ title: lesson.title, status: lesson.status }),
        },
      })
    } catch {}

    return NextResponse.json(lesson)
  } catch (err: any) {
    console.error('Error creating lesson:', err)
    return NextResponse.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    )
  }
}
