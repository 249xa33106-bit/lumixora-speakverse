import { describe, it, expect } from 'vitest'
import {
  TUTOR_V1,
  TELUGU_V1,
  INTERVIEW_V1,
  ROLEPLAY_V1,
} from '@/lib/ai/prompt-registry'
import {
  tutorFeedbackSchema,
  getTutorFeedback,
} from '@/lib/ai/tutor-adapter'
import {
  teluguExplanationSchema,
  getTeluguExplanation,
} from '@/lib/ai/telugu-adapter'
import {
  interviewEvaluationSchema,
  evaluateInterviewAnswer,
} from '@/lib/ai/interview-evaluator'

describe('AI Coaching Layer - Prompt Registry', () => {
  it('TUTOR_V1 fills all variables according to spec §8.1', () => {
    const prompt = TUTOR_V1({
      level: 'B1',
      objective: 'Practice self-introduction',
      activityType: 'spoken_response',
      languagePreference: 'Telugu + English',
      mistakes: ['subject-verb disagreement'],
      learnerText: 'I is studying computer science.',
    })

    expect(prompt).toContain('B1')
    expect(prompt).toContain('Practice self-introduction')
    expect(prompt).toContain('spoken_response')
    expect(prompt).toContain('Telugu + English')
    expect(prompt).toContain('subject-verb disagreement')
    expect(prompt).toContain('I is studying computer science.')
    expect(prompt).toContain('SYSTEM ROLE')
  })

  it('TELUGU_V1 fills variables and enforces bilingual rules per spec §8.4', () => {
    const prompt = TELUGU_V1({
      concept: 'Present Continuous Tense',
      level: 'A2',
      example: 'I am reading a book.',
      misconception: 'Translating directly from Telugu without helping verb',
    })

    expect(prompt).toContain('Present Continuous Tense')
    expect(prompt).toContain('A2')
    expect(prompt).toContain('I am reading a book.')
    expect(prompt).toContain('Translating directly from Telugu without helping verb')
    expect(prompt).toContain('తెలుగులో సులభంగా వివరించండి')
  })

  it('INTERVIEW_V1 separates technical correctness from communication per spec §8.3', () => {
    const prompt = INTERVIEW_V1({
      targetRole: 'Full Stack Engineer',
      question: 'Explain how RESTful APIs handle caching.',
      competencies: ['Technical clarity', 'Structure', 'Terminology'],
      answer: 'APIs use Cache-Control headers to specify max-age and directives.',
      level: 'B2',
      technicalRubric: { cacheHeaders: 5, statusCodes: 5 },
    })

    expect(prompt).toContain('Full Stack Engineer')
    expect(prompt).toContain('Explain how RESTful APIs handle caching.')
    expect(prompt).toContain('Technical correctness MUST be scored SEPARATELY from communication')
    expect(prompt).toContain('STAR framework')
  })

  it('ROLEPLAY_V1 creates turn-based conversational role-play prompt per spec §8.2', () => {
    const prompt = ROLEPLAY_V1({
      scenario: 'Campus recruitment interview',
      level: 'B1',
      communicationGoal: 'Articulate final year project',
      feedbackMode: 'end_of_session',
      languagePreference: 'en',
    })

    expect(prompt).toContain('Campus recruitment interview')
    expect(prompt).toContain('Articulate final year project')
    expect(prompt).toContain('end_of_session')
    expect(prompt).toContain('Remain in character during the conversation')
  })
})

describe('AI Coaching Layer - Tutor Adapter', () => {
  it('validates tutorFeedbackSchema correctly with valid structure', () => {
    const sample = {
      strengths: ['Clear pronunciation and vocabulary choice'],
      improvement: 'Use correct past continuous tense',
      original: 'I was work on project',
      corrected: 'I was working on the project',
      explanation: 'Continuous past action requires verb + -ing form',
      practiceQuestion: 'What were you working on yesterday at this time?',
      teluguExplanation: 'గతంలో కొనసాగుతున్న పనిని తెలపడానికి "was working" అని వాడాలి.',
      limitations: ['Formative AI assessment'],
    }

    const result = tutorFeedbackSchema.safeParse(sample)
    expect(result.success).toBe(true)
  })

  it('rejects malformed tutor feedback missing required fields', () => {
    const malformed = {
      strengths: [],
      // missing improvement, original, etc.
    }
    const result = tutorFeedbackSchema.safeParse(malformed)
    expect(result.success).toBe(false)
  })

  it('getTutorFeedback returns safe fallback and formative label when API key is unconfigured', async () => {
    const feedback = await getTutorFeedback({
      learnerText: 'I study computer science in my college.',
      activityType: 'short_writing',
      objective: 'Practice introduction',
      level: 'B1',
      preferTelugu: true,
      mistakes: [],
    })

    expect(feedback).toBeDefined()
    expect(feedback.strengths.length).toBeGreaterThan(0)
    expect(feedback.explanation).toBeDefined()
    expect(feedback.practiceQuestion).toBeDefined()
    expect(feedback.teluguExplanation).toBeDefined()
    expect(feedback.limitations.some((l) => l.toLowerCase().includes('formative'))).toBe(true)
  })
})

describe('AI Coaching Layer - Telugu Explanation Adapter', () => {
  it('validates teluguExplanationSchema correctly', () => {
    const valid = {
      concept: 'Prepositions of Place (In vs At)',
      meaningInTelugu: 'ప్రదేశాలను సూచించే విభక్తులు',
      ruleExplanation: 'Use "at" for specific points and "in" for enclosed spaces.',
      correctForm: 'I am at the college library.',
      whyIncorrectFails: 'Using "in" for an address or specific checkpoint is incorrect.',
      examples: ['I am at the gate.', 'She is in the classroom.'],
      practiceQuestion: 'Are you ___ home right now?',
      limitations: ['Bilingual pedagogical guidance'],
    }

    const result = teluguExplanationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('getTeluguExplanation returns safe bilingual fallback when unconfigured', async () => {
    const explanation = await getTeluguExplanation({
      concept: 'Subject-Verb Agreement',
      level: 'A2',
      example: 'He speaks fluent English.',
      misconception: 'Missing singular third-person -s',
    })

    expect(explanation).toBeDefined()
    expect(explanation.concept).toBe('Subject-Verb Agreement')
    expect(explanation.meaningInTelugu).toContain('భావన')
    expect(explanation.examples.length).toBeGreaterThanOrEqual(1)
    expect(explanation.limitations.some((l) => l.toLowerCase().includes('formative'))).toBe(true)
  })
})

describe('AI Coaching Layer - Interview Evaluator', () => {
  it('validates interviewEvaluationSchema and enforces separation of technical scores', () => {
    const valid = {
      summary: 'Strong structured answer following STAR method.',
      strengths: [
        {
          criterion: 'Logical Structure',
          evidence: 'Clearly explained situation, action, and resulting metric.',
        },
      ],
      scores: [
        {
          criterion: 'Relevance to Question',
          score: 4,
          maxScore: 5,
          evidence: 'Answer directly addressed the prompt.',
        },
        {
          criterion: 'Grammar and Sentence Construction',
          score: 4,
          maxScore: 5,
          evidence: 'Accurate complex sentences with proper conjunctions.',
        },
      ],
      technicalScore: {
        score: 5,
        maxScore: 5,
        feedback: 'Correct explanation of indexing algorithms in database query optimization.',
      },
      corrections: [
        {
          original: 'We done the project',
          corrected: 'We completed the project',
          explanation: 'Use completed for formal resume project descriptions',
        },
      ],
      answerFramework: 'STAR framework',
      followUpQuestion: 'How would your indexing strategy change for write-heavy workloads?',
      next_action: 'Practice articulating distributed systems trade-offs.',
      limitations: ['Formative AI evaluation - Not verified proficiency'],
    }

    const result = interviewEvaluationSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.technicalScore).toBeDefined()
      expect(result.data.technicalScore?.score).toBe(5)
      expect(result.data.scores.length).toBe(2)
    }
  })

  it('evaluateInterviewAnswer returns structured formative evaluation', async () => {
    const evaluation = await evaluateInterviewAnswer({
      targetRole: 'Data Analyst',
      question: 'Tell me about a time you analyzed messy data.',
      competencies: ['Problem Solving', 'Communication'],
      answer: 'In our college project I cleaned the sales dataset using Pandas and visualized missing values.',
      level: 'B1',
      technicalRubric: { dataWrangling: 5 },
    })

    expect(evaluation).toBeDefined()
    expect(evaluation.summary).toBeDefined()
    expect(evaluation.strengths.length).toBeGreaterThan(0)
    expect(evaluation.scores.length).toBeGreaterThanOrEqual(3)
    expect(evaluation.technicalScore).toBeDefined()
    expect(evaluation.next_action).toBeDefined()
    expect(evaluation.limitations.some((l) => l.toLowerCase().includes('formative'))).toBe(true)
  })
})
