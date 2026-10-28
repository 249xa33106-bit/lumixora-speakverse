import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id

  const courses = await prisma.svCourse.findMany({
    where: { status: 'published' },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { status: 'published' },
            orderBy: [{ stage: 'asc' }, { difficulty: 'asc' }],
            select: {
              id: true,
              slug: true,
              title: true,
              objective: true,
              difficulty: true,
              estimatedMinutes: true,
              skill: true,
              stage: true,
              _count: {
                select: { activities: true },
              },
            },
          },
        },
      },
    },
  })

  // User progress if logged in
  let progressMap: Record<string, string> = {}
  if (userId) {
    const progressList = await prisma.svLessonProgress.findMany({
      where: { userId },
      select: { lessonId: true, status: true },
    })
    for (const p of progressList) {
      progressMap[p.lessonId] = p.status
    }
  }

  return NextResponse.json({
    courses,
    progressMap,
  })
}
