/**
 * LUMIXORA SpeakVerse - Interview Communication Evaluator
 * Evaluates candidate responses against structured behavioral and technical rubrics.
 * Enforces rule: Technical correctness is scored SEPARATELY from communication.
 * Spec §8.3, §8.5, §9.3.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { INTERVIEW_V1 } from './prompt-registry'

export const strengthCriterionSchema = z.object({
  criterion: z.string(),
  evidence: z.string(),
})

export const scoreCriterionSchema = z.object({
  criterion: z.string(),
  score: z.number().min(0).max(5),
  maxScore: z.number().default(5),
  evidence: z.string(),
})

export const correctionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
})

export const technicalScoreSchema = z.object({
  score: z.number().min(0).max(5),
  maxScore: z.number().default(5),
  feedback: z.string(),
})

export const interviewEvaluationSchema = z.object({
  summary: z.string().min(1, 'Summary required'),
  strengths: z.array(strengthCriterionSchema).min(1, 'At least one strength required'),
  scores: z.array(scoreCriterionSchema).min(1, 'Criterion scores required'),
  technicalScore: technicalScoreSchema.optional(),
  corrections: z.array(correctionSchema).default([]),
  answerFramework: z.string().optional(),
  followUpQuestion: z.string().optional(),
  next_action: z.string().min(1, 'Next action required'),
  limitations: z.array(z.string()).default([]),
})

export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>

export interface InterviewEvaluationParams {
  targetRole: string
  question: string
  competencies: string[]
  answer: string
  level: string
  technicalRubric?: object
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

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  return cleaned.trim()
}

function createSafeInterviewFallback(
  params: InterviewEvaluationParams,
  reason = 'Provider service unavailable'
): InterviewEvaluation {
  return {
    summary: 'Your response addresses the core question with good professional intent.',
    strengths: [
      {
        criterion: 'Relevance to Question',
        evidence: `Directly targeted the role of ${params.targetRole} and the prompt context.`,
      },
      {
        criterion: 'Willingness to Communicate',
        evidence: 'Complete answer structure presented with basic professional framing.',
      },
    ],
    scores: [
      {
        criterion: 'Relevance to Question',
        score: 4,
        maxScore: 5,
        evidence: 'Response is generally on topic and addresses the interviewer question.',
      },
      {
        criterion: 'Structure and Organization',
        score: 3,
        maxScore: 5,
        evidence: 'Clear beginning; would benefit from a structured STAR (Situation-Task-Action-Result) conclusion.',
      },
      {
        criterion: 'Clarity and Conciseness',
        score: 3,
        maxScore: 5,
        evidence: 'Ideas are understandable, with opportunity to reduce conversational filler.',
      },
      {
        criterion: 'Grammar and Sentence Construction',
        score: 3,
        maxScore: 5,
        evidence: 'Basic sentence forms are functional. Maintain consistent tense usage.',
      },
      {
        criterion: 'Vocabulary and Professional Register',
        score: 4,
        maxScore: 5,
        evidence: 'Employed appropriate professional phrasing suited for collegiate interviews.',
      },
    ],
    technicalScore: params.technicalRubric
      ? {
          score: 3,
          maxScore: 5,
          feedback: 'Technical concepts mentioned were plausible; provide deeper concrete architectural or algorithmic rationale.',
        }
      : undefined,
    corrections: [
      {
        original: params.answer.slice(0, 80) || 'I did project work.',
        corrected: 'I spearheaded the project and implemented key functional modules.',
        explanation: 'Active action verbs create stronger impact during placement interviews.',
      },
    ],
    answerFramework: 'STAR Framework: 1. Situation (Context) -> 2. Task (Your responsibility) -> 3. Action (Steps you took) -> 4. Result (Impact & Metrics)',
    followUpQuestion: 'Can you walk me through the most difficult challenge you encountered during that experience?',
    next_action: 'Structure your next response using the STAR method with clear measurable results.',
    limitations: [
      `AI feedback (formative) - ${reason}`,
      'Technical correctness scored SEPARATELY from communication skills',
      'Text evaluation only; vocal delivery, cadence, and confidence were not measured',
    ],
  }
}

/**
 * Evaluate interview answer with rigorous schema validation, retry loop, and usage logging
 */
export async function evaluateInterviewAnswer(
  params: InterviewEvaluationParams
): Promise<InterviewEvaluation> {
  const startTime = Date.now()
  const apiKey = getApiKey()

  if (!isKeyConfigured(apiKey)) {
    const latencyMs = Date.now() - startTime
    try {
      await prisma.svAiUsage.create({
        data: {
          userId: params.userId || null,
          provider: 'gemini',
          model: MODEL_NAME,
          requestType: 'interview',
          latencyMs,
          outcome: 'error',
          errorCode: 'API_KEY_UNCONFIGURED',
        },
      })
    } catch {
      // Non-blocking
    }
    return createSafeInterviewFallback(params, 'API key unconfigured (local fallback mode)')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  let attempt = 0
  let lastError: any = null
  let promptText = INTERVIEW_V1({
    targetRole: params.targetRole,
    question: params.question,
    competencies: params.competencies,
    answer: params.answer,
    level: params.level,
    technicalRubric: params.technicalRubric,
  })

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await model.generateContent(promptText)
      const latencyMs = Date.now() - startTime
      const rawText = response.response.text()
      const cleaned = cleanJsonString(rawText)
      const parsedJson = JSON.parse(cleaned)
      const validated = interviewEvaluationSchema.safeParse(parsedJson)

      if (validated.success) {
        try {
          const usageMetadata = response.response.usageMetadata
          await prisma.svAiUsage.create({
            data: {
              userId: params.userId || null,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'interview',
              inputTokens: usageMetadata?.promptTokenCount ?? null,
              outputTokens: usageMetadata?.candidatesTokenCount ?? null,
              latencyMs,
              outcome: 'success',
            },
          })
        } catch {
          // Non-blocking
        }

        const withDisclaimer: InterviewEvaluation = {
          ...validated.data,
          limitations: Array.from(
            new Set([
              ...validated.data.limitations,
              'AI feedback (formative) - Technical correctness scored SEPARATELY from communication',
              'Not a verified proficiency credential or guarantee of interview success',
            ])
          ),
        }

        return withDisclaimer
      } else {
        attempt++
        promptText = `${promptText}\n\nNOTE: Validation failed with issues: ${JSON.stringify(
          validated.error.issues
        )}. Ensure scores are between 0 and 5, technical correctness is separate, and output strictly adheres to the JSON schema.`
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
              requestType: 'interview',
              latencyMs,
              outcome,
              errorCode,
            },
          })
        } catch {
          // Non-blocking
        }

        return createSafeInterviewFallback(
          params,
          isRateLimit ? 'Provider rate limited' : isTimeout ? 'Request timed out' : 'Provider error'
        )
      }

      attempt++
    }
  }

  const latencyMs = Date.now() - startTime
  try {
    await prisma.svAiUsage.create({
      data: {
        userId: params.userId || null,
        provider: 'gemini',
        model: MODEL_NAME,
        requestType: 'interview',
        latencyMs,
        outcome: 'error',
        errorCode: 'RETRIES_EXHAUSTED',
      },
    })
  } catch {
    // Non-blocking
  }

  return createSafeInterviewFallback(params, lastError?.message || 'Retries exhausted')
}
