'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Lightbulb,
  Trophy, RotateCcw, Volume2, Mic, Check
} from 'lucide-react'
import { toast } from 'sonner'

interface Activity {
  id: string
  activityType: string
  skill: string
  position: number
  instructionsI18n: string // JSON
  contentJson: string // JSON
  scoringConfig: string // JSON
}

interface LessonData {
  id: string
  title: string
  objective: string
  difficulty: string
  skill: string
  activities: Activity[]
}

export default function LessonPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params?.lessonId as string

  const [currentIndex, setCurrentIndex] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Current activity response state
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [availableTokens, setAvailableTokens] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [blankAnswer, setBlankAnswer] = useState('')
  const [freeText, setFreeText] = useState('')

  // Submission result state
  const [attemptResult, setAttemptResult] = useState<{
    score: number
    maxScore: number
    correct: boolean
    feedback?: { summary: string; nextAction: string } | null
  } | null>(null)

  const [aiTutorFeedback, setAiTutorFeedback] = useState<any>(null)

  const [totalScore, setTotalScore] = useState(0)
  const [isLessonComplete, setIsLessonComplete] = useState(false)

  const { data: lesson, isLoading } = useQuery<LessonData>({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/speakverse/v1/lessons/${lessonId}`)
      if (!res.ok) throw new Error('Failed to load lesson')
      return res.json()
    },
    enabled: !!lessonId,
  })

  const currentActivity = lesson?.activities?.[currentIndex]

  // Setup current activity state when currentIndex or currentActivity changes
  useEffect(() => {
    if (!currentActivity) return

    setAttemptResult(null)
    setAiTutorFeedback(null)
    setHintsUsed(0)
    setShowHint(false)
    setSelectedOption(null)
    setBlankAnswer('')
    setFreeText('')

    try {
      const content = JSON.parse(currentActivity.contentJson || '{}')
      if (currentActivity.activityType === 'sentence_reorder' && content.tokens) {
        // Shuffle tokens for learner
        const shuffled = [...content.tokens].sort(() => Math.random() - 0.5)
        setAvailableTokens(shuffled)
        setSelectedTokens([])
      }
    } catch {
      // fallback
    }
  }, [currentIndex, currentActivity])

  if (isLoading || !lesson) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse py-8">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded-sv" />
      </div>
    )
  }

  const activities = lesson.activities || []
  if (activities.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-sv-text">No activities published for this lesson yet.</h2>
        <Link href="/speakverse/learn" className="text-sv-primary font-semibold hover:underline">
          Return to Learning Path
        </Link>
      </div>
    )
  }

  const instructions = currentActivity ? JSON.parse(currentActivity.instructionsI18n || '{"en":""}') : { en: '' }
  const content = currentActivity ? JSON.parse(currentActivity.contentJson || '{}') : {}
  const scoring = currentActivity ? JSON.parse(currentActivity.scoringConfig || '{"maxPoints":10,"hintPenalty":2}') : { maxPoints: 10, hintPenalty: 2 }

  const handleUseHint = () => {
    setShowHint(true)
    setHintsUsed(prev => prev + 1)
  }

  const handleTokenClick = (token: string, fromSelected: boolean) => {
    if (attemptResult) return // locked once graded
    if (fromSelected) {
      setSelectedTokens(prev => {
        const idx = prev.indexOf(token)
        if (idx === -1) return prev
        const copy = [...prev]
        copy.splice(idx, 1)
        return copy
      })
      setAvailableTokens(prev => [...prev, token])
    } else {
      setAvailableTokens(prev => {
        const idx = prev.indexOf(token)
        if (idx === -1) return prev
        const copy = [...prev]
        copy.splice(idx, 1)
        return copy
      })
      setSelectedTokens(prev => [...prev, token])
    }
  }

  const handleSubmitAttempt = async () => {
    if (!currentActivity) return
    setSubmitting(true)

    let responsePayload: any = null
    switch (currentActivity.activityType) {
      case 'sentence_reorder':
        responsePayload = { type: 'sentence_reorder', tokens: selectedTokens }
        break
      case 'single_choice':
      case 'listening_mcq':
        responsePayload = { type: 'single_choice', selectedId: selectedOption }
        break
      case 'fill_blank':
        responsePayload = { type: 'fill_blank', answer: blankAnswer }
        break
      case 'short_writing':
        responsePayload = { type: 'short_writing', text: freeText }
        break
      case 'spoken_response':
        responsePayload = { type: 'spoken_response', transcriptText: freeText, transcriptConfidence: 0.9 }
        break
      default:
        responsePayload = { type: currentActivity.activityType, answer: freeText }
    }

    const idempotencyKey = `att_${currentActivity.id}_${Date.now()}`

    try {
      const res = await fetch(`/api/speakverse/v1/activities/${currentActivity.id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: idempotencyKey,
          response: responsePayload,
          hintsUsed,
          contentVersion: 1,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setAttemptResult({
          score: data.score,
          maxScore: data.maxScore,
          correct: data.correct,
          feedback: data.feedback,
        })
        setTotalScore(prev => prev + (data.score || 0))

        // Call AI Feedback route for short_writing or spoken_response
        if (currentActivity.activityType === 'short_writing' || currentActivity.activityType === 'spoken_response') {
          try {
            const aiRes = await fetch('/api/speakverse/v1/ai/feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityId: currentActivity.id,
                responseText: freeText,
                preferTelugu: false,
              }),
            })
            if (aiRes.ok) {
              const aiData = await aiRes.json()
              setAiTutorFeedback(aiData)
            }
          } catch (err) {
            console.error('Error fetching AI feedback:', err)
          }
        }
      } else {
        toast.error('Failed to submit attempt')
      }
    } catch {
      toast.error('Submission failed. Check your network.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (currentIndex < activities.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // Complete lesson
      try {
        await fetch(`/api/speakverse/v1/lessons/${lessonId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        })
      } catch {
        // silent
      }
      setIsLessonComplete(true)
    }
  }

  // LESSON COMPLETE CELEBRATION SCREEN
  if (isLessonComplete) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <Card padding="lg" className="space-y-6">
          <div className="inline-flex p-4 rounded-full bg-green-100 text-sv-success mb-2">
            <Trophy className="h-10 w-10" />
          </div>
          <div>
            <span className="text-xs font-semibold text-sv-primary uppercase tracking-wider">
              Lesson Completed
            </span>
            <h1 className="text-2xl font-bold text-sv-text mt-1">{lesson.title}</h1>
            <p className="text-sm text-sv-text-secondary mt-1">
              Outstanding practice! Every activity builds your conversational competence.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-sv p-6 text-center">
            <span className="text-xs text-sv-text-secondary font-medium">Points Earned</span>
            <div className="text-4xl font-extrabold text-sv-primary my-1">
              {totalScore} pts
            </div>
            <p className="text-xs text-sv-text-secondary">
              Logged to your skill progression graph & spaced revision queue.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              fullWidth
              onClick={() => router.push('/speakverse/learn')}
            >
              Back to Curriculum Path <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => router.push('/speakverse/home')}
            >
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const progressPct = ((currentIndex + 1) / activities.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <Link
          href="/speakverse/learn"
          className="inline-flex items-center gap-1.5 text-xs text-sv-text-secondary hover:text-sv-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lessons
        </Link>
        <span className="text-xs text-sv-text-secondary font-medium">
          Activity {currentIndex + 1} of {activities.length}
        </span>
      </div>

      <Progress value={progressPct} size="sm" color="primary" />

      {/* Main Activity Card */}
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant="info">
              {currentActivity?.skill.toUpperCase()}
            </Badge>
            <span className="text-xs text-sv-text-secondary font-medium">
              Max {scoring.maxPoints} pts
            </span>
          </div>
          <CardTitle className="text-base font-semibold text-sv-text">
            {instructions.en || 'Complete the activity'}
          </CardTitle>
          {instructions.te && (
            <p className="text-xs text-sv-accent telugu-text mt-1">
              {instructions.te}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ACTIVITY 1: SENTENCE REORDER */}
          {currentActivity?.activityType === 'sentence_reorder' && (
            <div className="space-y-4">
              {/* Target Drop/Click Area */}
              <div className="min-h-[64px] p-4 rounded-lg border-2 border-dashed border-sv-primary/40 bg-blue-50/40 flex flex-wrap gap-2 items-center">
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-sv-text-secondary italic">
                    Click the word tiles below in the correct order
                  </span>
                ) : (
                  selectedTokens.map((token, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!!attemptResult}
                      onClick={() => handleTokenClick(token, true)}
                      className="px-3.5 py-2 bg-sv-primary text-white font-medium text-sm rounded-lg shadow-sm hover:bg-sv-primary-hover transition-colors"
                      title="Click to remove"
                    >
                      {token}
                    </button>
                  ))
                )}
              </div>

              {/* Available Tokens Pool */}
              <div className="flex flex-wrap gap-2 pt-2">
                {availableTokens.map((token, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!!attemptResult}
                    onClick={() => handleTokenClick(token, false)}
                    className="px-4 py-2 bg-white border border-sv-border rounded-lg text-sm font-medium text-sv-text hover:border-sv-primary hover:bg-blue-50 transition-colors min-h-[44px]"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY 2: SINGLE CHOICE / LISTENING MCQ */}
          {(currentActivity?.activityType === 'single_choice' || currentActivity?.activityType === 'listening_mcq') && (
            <div className="space-y-4">
              {content.prompt && (
                <div className="p-4 bg-gray-50 border border-sv-border rounded-lg text-sm text-sv-text leading-relaxed">
                  {content.prompt}
                </div>
              )}

              {currentActivity.activityType === 'listening_mcq' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-sv-primary" />
                    <span className="text-xs text-sv-text-secondary">Audio Sample available</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if ('speechSynthesis' in window && content.prompt) {
                        const utt = new SpeechSynthesisUtterance(content.prompt)
                        window.speechSynthesis.speak(utt)
                      }
                    }}
                  >
                    Play Audio
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {(content.options || []).map((opt: { id: string; text: string }) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!!attemptResult}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full p-3.5 text-left rounded-lg border transition-all flex items-center justify-between min-h-[44px] ${
                      selectedOption === opt.id
                        ? 'border-sv-primary bg-blue-50 text-sv-primary font-medium ring-1 ring-sv-primary'
                        : 'border-sv-border bg-white hover:bg-gray-50 text-sv-text'
                    }`}
                  >
                    <span className="text-sm">{opt.text}</span>
                    {selectedOption === opt.id && <Check className="h-4 w-4 text-sv-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY 3: FILL BLANK */}
          {currentActivity?.activityType === 'fill_blank' && (
            <div className="space-y-4">
              {content.sentence && (
                <div className="p-4 bg-gray-50 border border-sv-border rounded-lg text-base text-sv-text">
                  {content.sentence.replace('_____', ' [ ________ ] ')}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-sv-text-secondary">
                  Your answer:
                </label>
                <input
                  type="text"
                  disabled={!!attemptResult}
                  value={blankAnswer}
                  onChange={e => setBlankAnswer(e.target.value)}
                  placeholder="Type the missing word..."
                  className="w-full px-4 py-2.5 text-sm border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary min-h-[44px]"
                />
              </div>
            </div>
          )}

          {/* ACTIVITY 4: SHORT WRITING OR SPOKEN WITH TEXT FALLBACK */}
          {(currentActivity?.activityType === 'short_writing' || currentActivity?.activityType === 'spoken_response') && (
            <div className="space-y-4">
              {content.prompt && (
                <div className="p-4 bg-gray-50 border border-sv-border rounded-lg text-sm text-sv-text">
                  {content.prompt}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-sv-text-secondary mb-1">
                  Your Response (Text Fallback Supported):
                </label>
                <textarea
                  rows={4}
                  disabled={!!attemptResult}
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="Type your structured answer here..."
                  className="w-full p-3 text-sm border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary"
                />
              </div>
            </div>
          )}

          {/* HINT SYSTEM */}
          {content.hint && (
            <div className="pt-2">
              {!showHint ? (
                <button
                  type="button"
                  onClick={handleUseHint}
                  className="text-xs text-sv-warning font-medium inline-flex items-center gap-1 hover:underline"
                >
                  <Lightbulb className="h-3.5 w-3.5" /> Need a hint? (-{scoring.hintPenalty} pts)
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-sv-warning flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Hint:</span> {content.hint}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATTEMPT FEEDBACK BANNER */}
          {attemptResult && (
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                attemptResult.correct
                  ? 'bg-green-50 border-green-200 text-sv-success'
                  : 'bg-red-50 border-red-200 text-sv-error'
              }`}
            >
              {attemptResult.correct ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-sm">
                <div className="font-bold">
                  {attemptResult.correct ? 'Correct!' : 'Not quite right.'} ({attemptResult.score}/{attemptResult.maxScore} pts)
                </div>
                {attemptResult.feedback?.summary && (
                  <p className="text-xs text-sv-text">{attemptResult.feedback.summary}</p>
                )}
                {attemptResult.feedback?.nextAction && (
                  <p className="text-xs text-sv-text-secondary">{attemptResult.feedback.nextAction}</p>
                )}
              </div>
            </div>
          )}

          {/* AI TUTOR FEEDBACK INLINE */}
          {aiTutorFeedback && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sv-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" /> AI Coaching Feedback
                </span>
                {aiTutorFeedback.score !== undefined && (
                  <Badge variant="info">{aiTutorFeedback.score}% Formative Score</Badge>
                )}
              </div>
              {aiTutorFeedback.summary && (
                <p className="text-xs text-sv-text leading-relaxed">{aiTutorFeedback.summary}</p>
              )}
              {aiTutorFeedback.strengths && aiTutorFeedback.strengths.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-sv-success">Strengths:</span>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-sv-text">
                    {aiTutorFeedback.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiTutorFeedback.improvements && aiTutorFeedback.improvements.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-sv-warning">Areas to Polish:</span>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-sv-text">
                    {aiTutorFeedback.improvements.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiTutorFeedback.teluguExplanation && (
                <div className="p-2.5 rounded bg-white/80 border border-blue-100 text-xs text-sv-accent telugu-text">
                  <span className="font-semibold block mb-0.5">తెలుగు వివరణ:</span>
                  {aiTutorFeedback.teluguExplanation}
                </div>
              )}
              {aiTutorFeedback.nextAction && (
                <p className="text-[11px] text-sv-text-secondary italic">
                  <strong>Recommendation:</strong> {aiTutorFeedback.nextAction}
                </p>
              )}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-sv-border flex justify-end">
            {!attemptResult ? (
              <Button
                type="button"
                size="md"
                loading={submitting}
                onClick={handleSubmitAttempt}
              >
                Check Answer
              </Button>
            ) : (
              <Button
                type="button"
                size="md"
                onClick={handleNext}
              >
                {currentIndex < activities.length - 1 ? 'Next Activity' : 'Finish Lesson'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
