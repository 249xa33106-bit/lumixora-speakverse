/**
 * LUMIXORA SpeakVerse - AI Tutor Adapter
 * Implements Gemini 2.0 Flash integration for tutor feedback.
 * Spec §8.1 and implementation rules.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { TUTOR_V1 } from './prompt-registry'

export const tutorFeedbackSchema = z.object({
  strengths: z.array(z.string()).min(1, 'At least one strength required'),
  improvement: z.string().min(1, 'Improvement area required'),
  original: z.string(),
  corrected: z.string(),
  explanation: z.string().min(1, 'Explanation required'),
  practiceQuestion: z.string().min(1, 'Practice question required'),
  teluguExplanation: z.string().optional(),
  limitations: z.array(z.string()).default([]),
})

export type TutorFeedback = z.infer<typeof tutorFeedbackSchema>

export interface TutorFeedbackParams {
  learnerText: string
  activityType: string
  objective: string
  level: string
  preferTelugu: boolean
  mistakes: string[]
  userId?: string
}

const MODEL_NAME = 'gemini-2.0-flash-lite'
const MAX_RETRIES = 2

function getApiKey(): string {
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
}

function isKeyConfigured(key: string): boolean {
  return Boolean(key && key.trim() !== '' && !key.includes('your-gemini-api-key'))
}

/**
 * Clean and extract JSON string from AI response text
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  return cleaned.trim()
}

/**
 * Generate high-quality fallback feedback when AI provider is unavailable, rate limited, or unconfigured
 */
function createSafeFallback(params: TutorFeedbackParams, reason = 'Provider service unavailable'): TutorFeedback {
  const isTelugu = params.preferTelugu
  return {
    strengths: [
      'Good effort in attempting the practice exercise with clear intent.',
      'Response structure demonstrates communication willingness.',
    ],
    improvement: 'Focus on consistent subject-verb agreement and natural word order.',
    original: params.learnerText,
    corrected: params.learnerText.trim() ? params.learnerText.trim() : 'I am preparing my answers carefully.',
    explanation: 'Clear communication begins with subject, action verb, and object in sequence. Practice using active present tense.',
    practiceQuestion: 'How would you rephrase this sentence using simple present tense?',
    teluguExplanation: isTelugu
      ? 'వాక్య నిర్మాణం సరిగ్గా ఉండటానికి కర్త (Subject), క్రియ (Verb) సరైన క్రమంలో ఉండాలి. రోజువారీ సాధనతో మీ ఆంగ్ల ప్రావీణ్యం మెరుగవుతుంది.'
      : undefined,
    limitations: [
      `AI feedback (formative) - ${reason}`,
      'Automated assessment text only; not a verified proficiency measurement',
    ],
  }
}

/**
 * Get AI Tutor feedback with validation, retries, and usage logging
 */
export async function getTutorFeedback(params: TutorFeedbackParams): Promise<TutorFeedback> {
  const startTime = Date.now()
  const apiKey = getApiKey()

  if (!isKeyConfigured(apiKey)) {
    const latencyMs = Date.now() - startTime
    // Log fallback usage to DB
    try {
      await prisma.svAiUsage.create({
        data: {
          userId: params.userId || null,
          provider: 'gemini',
          model: MODEL_NAME,
          requestType: 'tutor',
          latencyMs,
          outcome: 'error',
          errorCode: 'API_KEY_UNCONFIGURED',
        },
      })
    } catch {
      // Ignore DB logging failure to avoid breaking user experience
    }
    return createSafeFallback(params, 'API key unconfigured (local fallback mode)')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  let attempt = 0
  let lastError: any = null
  let promptText = TUTOR_V1({
    level: params.level,
    objective: params.objective,
    activityType: params.activityType,
    languagePreference: params.preferTelugu ? 'Telugu + English' : 'English',
    mistakes: params.mistakes,
    learnerText: params.learnerText,
  })

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await model.generateContent(promptText)
      const latencyMs = Date.now() - startTime
      const rawText = response.response.text()
      const cleaned = cleanJsonString(rawText)
      const parsedJson = JSON.parse(cleaned)
      const validated = tutorFeedbackSchema.safeParse(parsedJson)

      if (validated.success) {
        // Log successful usage
        try {
          const usageMetadata = response.response.usageMetadata
          await prisma.svAiUsage.create({
            data: {
              userId: params.userId || null,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'tutor',
              inputTokens: usageMetadata?.promptTokenCount ?? null,
              outputTokens: usageMetadata?.candidatesTokenCount ?? null,
              latencyMs,
              outcome: 'success',
            },
          })
        } catch {
          // Non-blocking
        }

        // Guarantee formative disclaimer in limitations
        const withDisclaimer: TutorFeedback = {
          ...validated.data,
          limitations: Array.from(
            new Set([
              ...validated.data.limitations,
              'AI feedback (formative) - Not verified proficiency certification',
            ])
          ),
        }

        return withDisclaimer
      } else {
        // Malformed structure - retry with instructions
        attempt++
        promptText = `${promptText}\n\nNOTE: Your previous response failed schema validation with errors: ${JSON.stringify(
          validated.error.issues
        )}. Return strictly valid JSON adhering to the specified format.`
      }
    } catch (err: any) {
      lastError = err
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')
      const isTimeout =
        err?.code === 'ETIMEDOUT' ||
        err?.name === 'TimeoutError' ||
        err?.message?.includes('timeout')

      if (isRateLimit || isTimeout || attempt >= MAX_RETRIES) {
        const latencyMs = Date.now() - startTime
        const outcome = isRateLimit ? 'rate_limited' : isTimeout ? 'timeout' : 'error'
        const errorCode = err?.status?.toString() || err?.code || 'PROVIDER_ERROR'

        try {
          await prisma.svAiUsage.create({
            data: {
              userId: params.userId || null,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'tutor',
              latencyMs,
              outcome,
              errorCode,
            },
          })
        } catch {
          // Non-blocking
        }

        return createSafeFallback(
          params,
          isRateLimit ? 'Provider rate limited' : isTimeout ? 'Request timed out' : 'Provider error'
        )
      }

      attempt++
    }
  }

  // If retries exhausted without hard error
  const latencyMs = Date.now() - startTime
  try {
    await prisma.svAiUsage.create({
      data: {
        userId: params.userId || null,
        provider: 'gemini',
        model: MODEL_NAME,
        requestType: 'tutor',
        latencyMs,
        outcome: 'error',
        errorCode: 'RETRIES_EXHAUSTED',
      },
    })
  } catch {
    // Non-blocking
  }

  return createSafeFallback(params, lastError?.message || 'Response validation retries exhausted')
}
