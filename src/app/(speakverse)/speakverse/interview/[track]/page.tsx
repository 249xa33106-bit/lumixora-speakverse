'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  MicOff,
  FileEdit,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

const TRACK_TITLES: Record<string, { title: string; desc: string; defaultRole: string }> = {
  'hr-interviews': {
    title: 'HR Interviews',
    desc: 'Practice personal elevator pitches, workplace situations, and company culture inquiries.',
    defaultRole: 'Graduate Trainee / Associate Software Engineer',
  },
  'internship-interviews': {
    title: 'Internship Interviews',
    desc: 'Highlight projects, academic coursework, problem solving, and quick-learning capacity.',
    defaultRole: 'Software Engineering Intern',
  },
  'technical-explanations': {
    title: 'Technical Explanations',
    desc: 'Demonstrate domain clarity, conceptual depth, and structured communication without jargon overload.',
    defaultRole: 'Full Stack Developer',
  },
  'project-walkthroughs': {
    title: 'Project Walkthroughs',
    desc: 'Walk through your flagship college projects using structured architectural narrative.',
    defaultRole: 'Backend Developer',
  },
  'behavioral-situational': {
    title: 'Behavioral & Situational',
    desc: 'Master the STAR framework (Situation, Task, Action, Result) for behavioral questions.',
    defaultRole: 'Associate Consultant / Engineer',
  },
  'resume-based': {
    title: 'Resume-Based Round',
    desc: 'Be grilled on your stated skills, coursework, academic highlights, and tools.',
    defaultRole: 'Data Analyst / Junior Engineer',
  },
  'communication-rounds': {
    title: 'Communication Rounds',
    desc: 'Persuasive speaking, structured viewpoints, and professional clarity under time pressure.',
    defaultRole: 'Business Technology Analyst',
  },
  'full-mock-interview': {
    title: 'Full Mock Interview',
    desc: 'Comprehensive end-to-end interview simulation covering introductory, technical, and behavioral rounds.',
    defaultRole: 'Software Engineer',
  },
}

export default function InterviewSetupPage() {
  const params = useParams()
  const router = useRouter()
  const trackSlug = String(params?.track || 'hr-interviews')
  const trackInfo = TRACK_TITLES[trackSlug] || {
    title: 'Mock Interview Arena',
    desc: 'Practice customized placement interview rounds with real-time feedback.',
    defaultRole: 'Software Engineer',
  }

  const [targetRole, setTargetRole] = useState(trackInfo.defaultRole)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [duration, setDuration] = useState<number>(20)
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text')
  const [feedbackTiming, setFeedbackTiming] = useState<'immediate' | 'end_of_session'>('immediate')
  const [loading, setLoading] = useState(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const difficultyMap: Record<string, string> = {
        Easy: 'A2',
        Medium: 'B1',
        Hard: 'B2',
      }

      const res = await fetch('/api/speakverse/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'mock_interview',
          type: 'mock_interview',
          scenarioId: trackSlug,
          targetRole: targetRole.trim() || trackInfo.defaultRole,
          difficulty: difficultyMap[difficulty] || 'B1',
          inputMode: responseMode,
          feedbackMode: feedbackTiming,
          durationMinutes: duration,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.message || 'Failed to initialize session')
      }

      const data = await res.json()
      const sessionId = data.id || data.sessionId || data.session?.id
      if (!sessionId) {
        throw new Error('Session ID not returned from server')
      }

      toast.success('Interview session initiated!')
      router.push(`/speakverse/interview/${trackSlug}/session/${sessionId}`)
    } catch (err: unknown) {
      console.error('Session start error:', err)
      const message = err instanceof Error ? err.message : 'Could not start interview session. Please try again.'
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/speakverse/interview"
          className="inline-flex items-center gap-1.5 text-sm text-sv-text-secondary hover:text-sv-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary rounded-md p-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Track Selection
        </Link>
      </div>

      <Card className="border-sv-border shadow-sv-card">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-sv-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <Badge variant="info">Pre-Session Configuration</Badge>
          </div>
          <CardTitle className="text-2xl font-bold">{trackInfo.title}</CardTitle>
          <CardDescription className="text-sm">{trackInfo.desc}</CardDescription>
        </CardHeader>

        <form onSubmit={handleStart}>
          <CardContent className="space-y-6">
            {/* 1. Target Role */}
            <div>
              <Input
                label="Target Role or Job Profile"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Associate Software Engineer, Data Analyst, Cloud Intern"
                hint="The AI interviewer will adapt questioning criteria specifically to this role."
                required
              />
            </div>

            {/* 2. Difficulty */}
            <div>
              <label className="block text-sm font-medium text-sv-text mb-2">
                Interview Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-center min-h-[44px] ${
                      difficulty === level
                        ? 'border-sv-primary bg-blue-50 text-sv-primary font-semibold ring-2 ring-sv-primary/20'
                        : 'border-sv-border bg-sv-surface text-sv-text hover:bg-gray-50'
                    }`}
                  >
                    {level}
                    <span className="block text-xs font-normal text-sv-text-secondary mt-0.5">
                      {level === 'Easy' ? 'A2 Foundation' : level === 'Medium' ? 'B1 Placement' : 'B2 Rigorous'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Duration */}
            <div>
              <label className="block text-sm font-medium text-sv-text mb-2">
                Session Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[10, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all text-center min-h-[44px] ${
                      duration === mins
                        ? 'border-sv-primary bg-blue-50 text-sv-primary font-semibold ring-2 ring-sv-primary/20'
                        : 'border-sv-border bg-sv-surface text-sv-text hover:bg-gray-50'
                    }`}
                  >
                    {mins} Minutes
                    <span className="block text-xs font-normal text-sv-text-secondary mt-0.5">
                      ~{Math.round(mins / 3.5)} questions
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Response Mode */}
            <div>
              <label className="block text-sm font-medium text-sv-text mb-2">
                Response Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResponseMode('text')}
                  className={`p-3.5 rounded-lg border text-left transition-all min-h-[44px] ${
                    responseMode === 'text'
                      ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/20'
                      : 'border-sv-border bg-sv-surface hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm text-sv-text">
                    <FileEdit className="h-4 w-4 text-sv-primary" aria-hidden="true" />
                    <span>Typed Text Input</span>
                  </div>
                  <p className="text-xs text-sv-text-secondary mt-1">
                    Type your answers with accessible keyboard control. Available now.
                  </p>
                </button>

                <div
                  className="p-3.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 opacity-75 cursor-not-allowed"
                  title="Voice mode coming in Phase 3"
                >
                  <div className="flex items-center gap-2 font-medium text-sm text-gray-500">
                    <MicOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <span>Voice Input</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-auto">
                      Coming in Phase 3
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Voice response mode with pronunciation scoring will launch in Phase 3.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Feedback Timing */}
            <div>
              <label className="block text-sm font-medium text-sv-text mb-2">
                Feedback Timing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackTiming('immediate')}
                  className={`p-3.5 rounded-lg border text-left transition-all min-h-[44px] ${
                    feedbackTiming === 'immediate'
                      ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/20'
                      : 'border-sv-border bg-sv-surface hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm text-sv-text">
                    <Sparkles className="h-4 w-4 text-sv-primary" aria-hidden="true" />
                    <span>After Each Answer</span>
                  </div>
                  <p className="text-xs text-sv-text-secondary mt-1">
                    Instant AI critique on structure, clarity, and vocabulary after every question.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackTiming('end_of_session')}
                  className={`p-3.5 rounded-lg border text-left transition-all min-h-[44px] ${
                    feedbackTiming === 'end_of_session'
                      ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/20'
                      : 'border-sv-border bg-sv-surface hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm text-sv-text">
                    <CheckCircle2 className="h-4 w-4 text-sv-primary" aria-hidden="true" />
                    <span>End of Session</span>
                  </div>
                  <p className="text-xs text-sv-text-secondary mt-1">
                    Realistic uninterrupted simulation. Full comprehensive report upon completion.
                  </p>
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              size="lg"
              loading={loading}
              fullWidth
              className="font-semibold"
            >
              Start Interview
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
