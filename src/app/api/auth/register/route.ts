import { prisma } from '@/lib/db/client'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'student',
        svProfile: {
          create: {
            displayName: name,
            learningGoal: 'interview',
            explanationLanguage: 'en',
            dailyGoalMinutes: 10,
            onboardingComplete: false,
            assessmentComplete: false,
          },
        },
        svRoles: {
          create: {
            role: 'student',
          },
        },
      },
    })

    // Also create user preferences
    await prisma.svUserPreference.create({
      data: {
        userId: user.id,
        captionsDefault: false,
        audioSpeed: 1.0,
        notifications: true,
      },
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
