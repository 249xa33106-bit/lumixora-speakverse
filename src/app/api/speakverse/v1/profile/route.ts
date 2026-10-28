import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  college: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  targetRole: z.string().max(200).optional(),
  learningGoal: z.enum(['interview', 'fluency', 'presentation', 'internship', 'workplace']).optional(),
  explanationLanguage: z.enum(['en', 'te_en']).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(60).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  onboardingComplete: z.boolean().optional(),
  assessmentComplete: z.boolean().optional(),
  selfAssessedLevel: z.string().optional(),
  // User Preferences
  captionsDefault: z.boolean().optional(),
  audioSpeed: z.number().min(0.5).max(2.0).optional(),
  notifications: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  fontSize: z.enum(['sm', 'md', 'lg']).optional(),
  highContrast: z.boolean().optional(),
  // Recording Retention
  recordingRetention: z.enum(['session', '30_days', 'explicit_consent']).optional(),
  // Consent action
  withdrawConsent: z.string().optional(),
  grantConsent: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  let profile = await prisma.svProfile.findUnique({ where: { userId } })
  if (!profile) {
    profile = await prisma.svProfile.create({
      data: {
        userId,
        explanationLanguage: 'en',
        dailyGoalMinutes: 10,
      },
    })
  }

  let preferences = await prisma.svUserPreference.findUnique({ where: { userId } })
  if (!preferences) {
    preferences = await prisma.svUserPreference.create({
      data: {
        userId,
        captionsDefault: false,
        audioSpeed: 1.0,
        notifications: true,
        reducedMotion: false,
        fontSize: 'md',
        highContrast: false,
      },
    })
  }

  const consents = await prisma.svConsent.findMany({
    where: { userId },
    orderBy: { grantedAt: 'desc' },
  })

  // Get current user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, role: true },
  })

  return NextResponse.json({
    profile,
    preferences,
    consents,
    user,
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const body = await req.json()
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const {
    displayName,
    college,
    degree,
    targetRole,
    learningGoal,
    explanationLanguage,
    dailyGoalMinutes,
    targetDate,
    onboardingComplete,
    assessmentComplete,
    selfAssessedLevel,
    captionsDefault,
    audioSpeed,
    notifications,
    reducedMotion,
    fontSize,
    highContrast,
    recordingRetention,
    withdrawConsent,
    grantConsent,
  } = parsed.data

  // 1. Update Profile
  const profile = await prisma.svProfile.upsert({
    where: { userId },
    update: {
      displayName,
      college,
      degree,
      targetRole,
      learningGoal,
      explanationLanguage,
      dailyGoalMinutes,
      targetDate: targetDate ? new Date(targetDate) : targetDate === null ? null : undefined,
      onboardingComplete,
      assessmentComplete,
      selfAssessedLevel,
    },
    create: {
      userId,
      displayName,
      college,
      degree,
      targetRole,
      learningGoal,
      explanationLanguage: explanationLanguage || 'en',
      dailyGoalMinutes: dailyGoalMinutes || 10,
      targetDate: targetDate ? new Date(targetDate) : null,
      onboardingComplete: onboardingComplete ?? false,
      assessmentComplete: assessmentComplete ?? false,
      selfAssessedLevel,
    },
  })

  // 2. Update Preferences
  const preferences = await prisma.svUserPreference.upsert({
    where: { userId },
    update: {
      captionsDefault,
      audioSpeed,
      notifications,
      reducedMotion,
      fontSize,
      highContrast,
    },
    create: {
      userId,
      captionsDefault: captionsDefault ?? false,
      audioSpeed: audioSpeed ?? 1.0,
      notifications: notifications ?? true,
      reducedMotion: reducedMotion ?? false,
      fontSize: fontSize ?? 'md',
      highContrast: highContrast ?? false,
    },
  })

  // 3. Handle recording retention preference
  if (recordingRetention) {
    await prisma.svAudioAsset.updateMany({
      where: { userId },
      data: { retentionPolicy: recordingRetention },
    })
  }

  // 4. Handle consents
  if (withdrawConsent) {
    await prisma.svConsent.updateMany({
      where: { userId, purpose: withdrawConsent },
      data: { granted: false, withdrawnAt: new Date() },
    })
  } else if (grantConsent) {
    await prisma.svConsent.create({
      data: {
        userId,
        purpose: grantConsent,
        privacyVersion: '1.0',
        granted: true,
      },
    })
  }

  const updatedConsents = await prisma.svConsent.findMany({
    where: { userId },
    orderBy: { grantedAt: 'desc' },
  })

  return NextResponse.json({
    profile,
    preferences,
    consents: updatedConsents,
    success: true,
  })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Cascade delete user data
  await prisma.user.delete({
    where: { id: userId },
  })

  return NextResponse.json({ success: true, message: 'Account deleted' })
}
