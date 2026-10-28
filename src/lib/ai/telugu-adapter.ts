/**
 * LUMIXORA SpeakVerse - Telugu Explanation Adapter
 * Implements bilingual pedagogical scaffolding for Telugu speakers.
 * Spec §8.4 and implementation rules.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { TELUGU_V1 } from './prompt-registry'

export const teluguExplanationSchema = z.object({
  concept: z.string(),
  meaningInTelugu: z.string().min(1, 'Telugu meaning required'),
  ruleExplanation: z.string().min(1, 'Rule explanation required'),
  correctForm: z.string().min(1, 'Correct form required'),
  whyIncorrectFails: z.string().min(1, 'Reason for error required'),
  examples: z.array(z.string()).min(1, 'At least one example required'),
  practiceQuestion: z.string().min(1, 'Practice question required'),
  limitations: z.array(z.string()).default([]),
})

export type TeluguExplanation = z.infer<typeof teluguExplanationSchema>

export interface TeluguExplanationParams {
  concept: string
  level: string
  example: string
  misconception?: string
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

function createSafeTeluguFallback(params: TeluguExplanationParams, reason = 'Service unavailable'): TeluguExplanation {
  return {
    concept: params.concept,
    meaningInTelugu: `${params.concept} భావన: రోజువారీ ఆంగ్ల సంభాషణలో వాక్యాలను స్పష్టంగా మరియు సూటిగా రూపొందించడానికి ఇది ఉపయోగపడుతుంది.`,
    ruleExplanation: `ఆంగ్లంలో సాధారణ వాక్య నిర్మాణం Subject + Verb + Object క్రమంలో ఉంటుంది. తెలుగు వాక్య నిర్మాణం (Subject + Object + Verb) తో పోల్చినప్పుడు క్రియ స్థానం మారుతుంది.`,
    correctForm: params.example || 'I study computer science at the university.',
    whyIncorrectFails: params.misconception || 'తెలుగు నుండి యథాతథంగా అనువదించడం వలన (Direct translation) వాక్య క్రమం తప్పుగా ఏర్పడవచ్చు.',
    examples: [
      'I am preparing for campus placement interviews.',
      'She explains technical concepts clearly in English.',
    ],
    practiceQuestion: `మీ గురించి ఈ కాన్సెప్ట్ (${params.concept}) ఉపయోగించి ఒక ఆంగ్ల వాక్యం రాయండి.`,
    limitations: [
      `AI pedagogical assistance (formative) - ${reason}`,
      'Consult reference grammar lessons for exhaustive rules',
    ],
  }
}

/**
 * Get Telugu-assisted English explanation with validation and usage logging
 */
export async function getTeluguExplanation(params: TeluguExplanationParams): Promise<TeluguExplanation> {
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
          requestType: 'telugu',
          latencyMs,
          outcome: 'error',
          errorCode: 'API_KEY_UNCONFIGURED',
        },
      })
    } catch {
      // Non-blocking
    }
    return createSafeTeluguFallback(params, 'API key unconfigured (local fallback mode)')
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
  let promptText = TELUGU_V1({
    concept: params.concept,
    level: params.level,
    example: params.example,
    misconception: params.misconception,
  })

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await model.generateContent(promptText)
      const latencyMs = Date.now() - startTime
      const rawText = response.response.text()
      const cleaned = cleanJsonString(rawText)
      const parsedJson = JSON.parse(cleaned)
      const validated = teluguExplanationSchema.safeParse(parsedJson)

      if (validated.success) {
        try {
          const usageMetadata = response.response.usageMetadata
          await prisma.svAiUsage.create({
            data: {
              userId: params.userId || null,
              provider: 'gemini',
              model: MODEL_NAME,
              requestType: 'telugu',
              inputTokens: usageMetadata?.promptTokenCount ?? null,
              outputTokens: usageMetadata?.candidatesTokenCount ?? null,
              latencyMs,
              outcome: 'success',
            },
          })
        } catch {
          // Non-blocking
        }

        const withDisclaimer: TeluguExplanation = {
          ...validated.data,
          limitations: Array.from(
            new Set([
              ...validated.data.limitations,
              'AI explanation (formative) - Telugu-assisted scaffolding',
            ])
          ),
        }

        return withDisclaimer
      } else {
        attempt++
        promptText = `${promptText}\n\nNOTE: Output failed validation: ${JSON.stringify(
          validated.error.issues
        )}. Return strictly valid JSON adhering to the specified schema.`
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
              requestType: 'telugu',
              latencyMs,
              outcome,
              errorCode,
            },
          })
        } catch {
          // Non-blocking
        }

        return createSafeTeluguFallback(
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
        requestType: 'telugu',
        latencyMs,
        outcome: 'error',
        errorCode: 'RETRIES_EXHAUSTED',
      },
    })
  } catch {
    // Non-blocking
  }

  return createSafeTeluguFallback(params, lastError?.message || 'Retries exhausted')
}
