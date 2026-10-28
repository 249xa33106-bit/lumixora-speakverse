import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const progressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']),
  currentActivityId: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await Promise.resolve(props.params)
  const lessonId = params.id

  const progress = await prisma.svLessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
  })

  return NextResponse.json(progress || { status: 'not_started' })
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await Promise.resolve(props.params)
  const lessonId = params.id

  const body = await req.json()
  const parsed = progressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const progress = await prisma.svLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId,
      },
    },
    update: {
      status: parsed.data.status,
      currentActivityId: parsed.data.currentActivityId,
      completedAt: parsed.data.status === 'completed' ? new Date() : undefined,
      lastAccessedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      lessonId,
      status: parsed.data.status,
      currentActivityId: parsed.data.currentActivityId,
      completedAt: parsed.data.status === 'completed' ? new Date() : null,
    },
  })

  return NextResponse.json(progress)
}
