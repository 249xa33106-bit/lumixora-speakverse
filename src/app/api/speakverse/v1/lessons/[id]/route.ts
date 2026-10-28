import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await Promise.resolve(props.params)
  const lessonId = params.id

  const lesson = await prisma.svLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: { id: true, title: true, courseId: true },
      },
      activities: {
        where: { status: 'published' },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          lessonId: true,
          activityType: true,
          skill: true,
          position: true,
          instructionsI18n: true,
          contentJson: true,
          // CRITICAL: NEVER include answerKeyJson here
          scoringConfig: true,
          rubricVersion: true,
        },
      },
    },
  })

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  return NextResponse.json(lesson)
}
