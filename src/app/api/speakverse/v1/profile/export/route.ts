import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      svProfile: true,
      svEnrollments: true,
      svLessonProgress: true,
      svActivityAttempts: true,
      svSkillEvidence: true,
      svRevisionItems: true,
      svSessions: {
        include: {
          turns: true,
          report: true,
        },
      },
      svConsents: true,
    },
  })

  return new Response(JSON.stringify(user, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="speakverse-export-${userId}.json"`,
    },
  })
}
