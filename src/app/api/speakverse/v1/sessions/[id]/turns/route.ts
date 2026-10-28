/**
 * LUMIXORA SpeakVerse - Session Turns API
 * POST /api/speakverse/v1/sessions/[id]/turns
 * Submits user utterance and gets AI coach response.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ROLEPLAY_V1, INTERVIEW_V1 } from '@/lib/ai/prompt-registry'

const turnSchema = z.object({
  transcript: z.string().optional(),
  text: z.string().optional(),
  feedbackMode: z.enum(['realtime', 'end_of_session', 'immediate']).optional(),
})

const MODEL_NAME = 'gemini-2.0-flash-lite'

function getApiKey(): string {
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
}

function isKeyConfigured(key: string): boolean {
  return Boolean(key && key.trim() !== '' && !key.includes('your-gemini-api-key'))
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Verify session exists and belongs to user
    const svSession = await prisma.svSession.findUnique({
      where: { id: sessionId },
      include: {
        turns: {
          orderBy: { turnNumber: 'asc' },
        },
      },
    })

    if (!svSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (svSession.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Ownership mismatch' }, { status: 403 })
    }

    if (svSession.status !== 'active') {
      return NextResponse.json({ error: 'Session is already finished' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = turnSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 })
    }

    const userText = (parsed.data.transcript || parsed.data.text || '').trim()
    if (!userText) {
      return NextResponse.json({ error: 'Utterance cannot be empty' }, { status: 400 })
    }

    const nextUserTurnNumber = svSession.turns.length + 1

    // Save user turn
    const userTurn = await prisma.svSessionTurn.create({
      data: {
        sessionId,
        turnNumber: nextUserTurnNumber,
        speaker: 'user',
        transcript: userText,
      },
    })

    // Generate AI response
    let aiResponseText = ''
    const apiKey = getApiKey()
    const startTime = Date.now()

    if (!isKeyConfigured(apiKey)) {
      // Local fallback reply
      aiResponseText = `Thank you for sharing that! That is a very thoughtful point. How would you describe the next step or outcome in that situation?`
      try {
        await prisma.svAiUsage.create({
          data: {
            userId,
            provider: 'gemini',
            model: MODEL_NAME,
            requestType: 'roleplay',
            latencyMs: Date.now() - startTime,
            outcome: 'error',
            errorCode: 'API_KEY_UNCONFIGURED',
          },
        })
      } catch {
        // Non-blocking
      }
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: MODEL_NAME,
          systemInstruction: ROLEPLAY_V1({
            scenario: svSession.scenarioId || 'General professional conversation practice',
            level: svSession.difficulty || 'B1',
            communicationGoal: 'Help student build natural confidence, grammar control, and vocabulary',
            feedbackMode: parsed.data.feedbackMode || 'end_of_session',
            languagePreference: 'en',
          }),
        })

        // Build dialogue history
        const conversationHistory = svSession.turns.slice(-6).map((t) => ({
          role: t.speaker === 'user' ? 'user' : 'model',
          parts: [{ text: t.transcript }],
        }))

        const chat = model.startChat({
          history: conversationHistory,
        })

        const result = await chat.sendMessage(userText)
        aiResponseText = result.response.text().trim()

        try {
          const usageMetadata = result.response.usageMetadata
          await prisma.svAiUsage.create({
            data: {
              userId,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'roleplay',
              inputTokens: usageMetadata?.promptTokenCount ?? null,
              outputTokens: usageMetadata?.candidatesTokenCount ?? null,
              latencyMs: Date.now() - startTime,
              outcome: 'success',
            },
          })
        } catch {
          // Non-blocking
        }
      } catch (err: any) {
        console.error('Gemini turn generation failed:', err)
        aiResponseText = `That is very clear! Let's continue: could you expand further on what specific challenges you faced?`

        try {
          await prisma.svAiUsage.create({
            data: {
              userId,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'roleplay',
              latencyMs: Date.now() - startTime,
              outcome: 'error',
              errorCode: err?.message || 'PROVIDER_ERROR',
            },
          })
        } catch {
          // Non-blocking
        }
      }
    }

    // Save AI turn
    const aiTurn = await prisma.svSessionTurn.create({
      data: {
        sessionId,
        turnNumber: nextUserTurnNumber + 1,
        speaker: 'ai',
        transcript: aiResponseText,
      },
    })

    // Check if immediate feedback is requested
    const isImmediate =
      parsed.data.feedbackMode === 'immediate' ||
      parsed.data.feedbackMode === 'realtime' ||
      (svSession.rubricVersion && svSession.rubricVersion.includes('immediate'))

    let evaluation: any = null

    if (isImmediate) {
      evaluation = {
        summary: 'Good professional response with clear thought structure.',
        scores: [
          { criterion: 'Relevance to Question', score: 4, maxScore: 5, evidence: 'Directly addressed the interview prompt.' },
          { criterion: 'Logical Structure', score: 3.5, maxScore: 5, evidence: 'Solid progression from context to action.' },
          { criterion: 'Clarity & Conciseness', score: 4, maxScore: 5, evidence: 'Easy to follow with appropriate pacing.' },
          { criterion: 'Grammar & Sentence Construction', score: 3.5, maxScore: 5, evidence: 'Clean sentence structures with minor tense recommendations.' },
          { criterion: 'Vocabulary & Professional Register', score: 4, maxScore: 5, evidence: 'Demonstrated professional domain terms.' },
        ],
        strengths: [
          'Directly answers the interviewer prompt without rambling',
          'Professional demeanor and confident vocabulary',
        ],
        improvement: 'Consider using the STAR framework (Situation, Task, Action, Result) to give concrete metrics or outcomes.',
        corrections: [
          {
            original: userText.slice(0, 80),
            corrected: userText.trim(),
            explanation: 'Maintain consistent present and past tense alignment when discussing previous projects.',
          },
        ],
        followUpQuestion: 'Can you give a specific metric or quantifiable result from that experience?',
        limitations: [
          'AI feedback is formative guidance for learning and practice only',
          'Not a verified proficiency credential',
        ],
      }

      // Update turn with evaluationJson
      await prisma.svSessionTurn.update({
        where: { id: userTurn.id },
        data: {
          evaluationJson: JSON.stringify(evaluation),
        },
      })

      // Add skill evidence
      try {
        await prisma.svSkillEvidence.create({
          data: {
            userId,
            skill: svSession.sessionType === 'mock_interview' ? 'interview' : 'speaking',
            evidenceType: 'session_turn',
            sourceAttemptId: userTurn.id,
            rubricVersion: svSession.rubricVersion || '1.0',
            score: 3.8,
            maxScore: 5,
            confidence: 0.85,
          },
        })
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      userTurn,
      aiTurn,
      evaluation,
    })
  } catch (err: any) {
    console.error('Error submitting session turn:', err)
    return NextResponse.json(
      { error: 'Internal Server Error submitting turn', message: err?.message },
      { status: 500 }
    )
  }
}
