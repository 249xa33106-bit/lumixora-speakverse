/**
 * LUMIXORA SpeakVerse - Session Report API
 * GET /api/speakverse/v1/sessions/[id]/report
 * Retrieves completed session report and turn history.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const svSession = await prisma.svSession.findUnique({
      where: { id: sessionId },
      include: {
        report: true,
        turns: {
          orderBy: { turnNumber: 'asc' },
        },
      },
    })

    if (!svSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (svSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      session: svSession,
      report: svSession.report,
      turns: svSession.turns,
    })
  } catch (err: any) {
    console.error('Error fetching session report:', err)
    return NextResponse.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    )
  }
}
