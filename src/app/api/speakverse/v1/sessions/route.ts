/**
 * LUMIXORA SpeakVerse - Sessions API
 * POST /api/speakverse/v1/sessions
 * Starts a conversational or practice session and initializes the first AI turn.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

const createSessionSchema = z.object({
  sessionType: z.string().optional(),
  type: z.string().optional(),
  scenarioId: z.string().optional(),
  difficulty: z.string().default('B1'),
  inputMode: z.string().default('text'),
  targetRole: z.string().optional(),
  openingMessage: z.string().optional(),
  feedbackMode: z.string().optional(),
  feedbackTiming: z.string().optional(),
  durationMinutes: z.number().optional(),
})

const DEFAULT_OPENINGS: Record<string, string> = {
  guided: "Hello! I am your SpeakVerse Coach. Let's practice introducing yourself in a campus interview. Tell me: what course are you pursuing and what sparked your interest in this field?",
  free: "Hi there! I am your SpeakVerse conversation partner. We can chat about your campus life, technology trends, or anything you'd like to practice in English. What is on your mind today?",
  scenario: "Welcome to today's workplace simulation. You are attending your first engineering project team meeting. How would you greet the team and introduce your project role?",
  topic: "Welcome! Today's topic is: 'The impact of Artificial Intelligence on engineering careers.' When you are ready, share your initial perspective.",
  challenge: "Welcome to the 1-Minute Challenge! Your goal is to speak continuously for 60 seconds on: 'A challenge I overcame in college.' Share your thoughts whenever you are ready.",
  pronunciation: "Welcome to pronunciation and intelligibility practice. Today we will focus on syllable stress and clear consonant articulation. Type or say: 'Effective communication requires consistent practice and patience.'",
  // Interview tracks
  'hr-interviews': "Welcome to your HR Round interview! To begin, could you please introduce yourself and tell me why you are interested in this position?",
  'hr': "Welcome to your HR Round interview! To begin, could you please introduce yourself and tell me why you are interested in this position?",
  'internship-interviews': "Hello! Welcome to the internship interview. Could you tell me about your background, what projects you have worked on in college, and what you hope to learn during this internship?",
  'internship': "Hello! Welcome to the internship interview. Could you tell me about your background, what projects you have worked on in college, and what you hope to learn during this internship?",
  'technical-explanations': "Welcome to the technical communication round. In clear and simple terms, please explain what an API (Application Programming Interface) is to someone without a technical background.",
  'technical': "Welcome to the technical communication round. In clear and simple terms, please explain what an API (Application Programming Interface) is to someone without a technical background.",
  'project-walkthroughs': "Welcome! Walk me through the most significant project you have built. What was the problem statement, your architectural approach, and your personal contribution?",
  'project': "Welcome! Walk me through the most significant project you have built. What was the problem statement, your architectural approach, and your personal contribution?",
  'behavioral-situational': "Welcome to your behavioral interview. Tell me about a time when you had to deal with a difficult team member or a tight project deadline. How did you resolve the situation?",
  'behavioral': "Welcome to your behavioral interview. Tell me about a time when you had to deal with a difficult team member or a tight project deadline. How did you resolve the situation?",
  'resume-based': "Welcome to the resume review interview. Looking at your skills and coursework, which project or achievement are you most proud of, and why?",
  'resume': "Welcome to the resume review interview. Looking at your skills and coursework, which project or achievement are you most proud of, and why?",
  'communication-rounds': "Welcome to the communication assessment. In 2 to 3 minutes, persuade a college club committee why they should adopt your proposal for an upcoming technical symposium.",
  'communication': "Welcome to the communication assessment. In 2 to 3 minutes, persuade a college club committee why they should adopt your proposal for an upcoming technical symposium.",
  'full-mock-interview': "Welcome to your comprehensive mock interview. Let us begin with your elevator pitch: tell me about yourself and your career goals over the next 2-3 years.",
  'full-mock': "Welcome to your comprehensive mock interview. Let us begin with your elevator pitch: tell me about yourself and your career goals over the next 2-3 years.",
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 })
    }

    const resolvedSessionType = parsed.data.sessionType || parsed.data.type || 'mock_interview'
    const { scenarioId, difficulty, inputMode, targetRole, openingMessage, feedbackMode, feedbackTiming } = parsed.data
    const resolvedFeedback = feedbackMode || feedbackTiming || 'immediate'

    // Determine initial prompt
    const initialAiPrompt =
      openingMessage ||
      (scenarioId && DEFAULT_OPENINGS[scenarioId]) ||
      (targetRole
        ? `Welcome to your interview practice for the role of ${targetRole}. Let us start: could you please give me a brief overview of your background and why you are interested in this role?`
        : "Hello! I am your SpeakVerse Interview Coach. How can I help you practice your interview communication today?")

    // Create session in sv_sessions
    const svSession = await prisma.svSession.create({
      data: {
        userId,
        sessionType: resolvedSessionType,
        scenarioId: scenarioId || null,
        difficulty,
        inputMode,
        targetRole: targetRole || null,
        status: 'active',
        rubricVersion: `1.0:${resolvedFeedback}`,
      },
    })

    // Create opening AI turn in sv_session_turns
    const openingTurn = await prisma.svSessionTurn.create({
      data: {
        sessionId: svSession.id,
        turnNumber: 1,
        speaker: 'ai',
        transcript: initialAiPrompt,
      },
    })

    return NextResponse.json({
      id: svSession.id,
      sessionId: svSession.id,
      session: svSession,
      initialTurn: openingTurn,
    })
  } catch (err: any) {
    console.error('Error starting session:', err)
    return NextResponse.json(
      { error: 'Internal Server Error starting session', message: err?.message },
      { status: 500 }
    )
  }
}
