'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  LogOut,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface Turn {
  id: string
  turnNumber: number
  speaker: 'user' | 'ai'
  transcript: string
  evaluationJson?: string | null
}

interface EvaluationData {
  summary?: string
  scores?: Array<{ criterion: string; score: number; maxScore: number; evidence: string }>
  strengths?: string[]
  improvement?: string
  corrections?: Array<{ original: string; corrected: string; explanation: string }>
  followUpQuestion?: string
  limitations?: string[]
}

const TRACK_QUESTION_BANKS: Record<string, string[]> = {
  'hr-interviews': [
    'Tell me about yourself, your educational background, and why you are interested in this position.',
    'What do you consider your greatest technical strength, and what is one area you are actively working to improve?',
    'Describe a situation where you had to adapt quickly to an unexpected change in a project or assignment.',
    'Where do you see yourself professionally in two to three years, and how does this role fit into that vision?',
    'Why should our team choose you over other qualified candidates applying for this role?',
    'Do you have any questions for us about the team, our engineering workflow, or the onboarding experience?',
  ],
  'internship-interviews': [
    'What inspired you to pursue software engineering, and what are you most eager to learn during an internship?',
    'Can you describe an academic project where you ran into a bug that took hours to fix? How did you solve it?',
    'How do you manage your time when juggling college coursework, lab deadlines, and interview preparation?',
    'How do you collaborate when working on a team project where other members have different skill levels?',
    'If you are assigned a technology stack you have never used before, what are the first three steps you take?',
  ],
  'technical-explanations': [
    'In clear, simple terms, explain how HTTPS encrypts communication between a web browser and a server.',
    'Explain the fundamental difference between SQL and NoSQL databases, and when you would choose each.',
    'What is the purpose of indexing in a database? How does it make lookups faster, and what is the trade-off?',
    'Explain the concept of asynchronous programming or promises to someone who has only written linear code.',
    'What is REST, and what makes an API truly RESTful compared to arbitrary HTTP endpoints?',
    'Explain the difference between authentication and authorization using a real-world campus analogy.',
  ],
  'project-walkthroughs': [
    'Walk me through the architecture of your flagship college project. What real-world problem does it address?',
    'What specific technology stack and libraries did you choose for this project, and why did you pick them?',
    'What was the single most difficult technical roadblock your team faced, and what role did you play in resolving it?',
    'If you had another two weeks to work on this project, what performance or architectural improvements would you make?',
    'How did you test and validate that your application handled errors gracefully?',
  ],
  'behavioral-situational': [
    'Tell me about a time when a teammate did not deliver their share of a group project. How did you handle the situation?',
    'Describe a situation where you received critical or negative feedback on your work. How did you react?',
    'Tell me about a time when you had to make a technical decision without having all the information you wanted.',
    'Can you share an experience where you had to meet an extremely tight deadline? How did you prioritize tasks?',
    'Describe a conflict between two viewpoints in a team discussion and how you helped reach a consensus.',
    'Tell me about a time you took initiative on a project without being explicitly told what to do.',
  ],
  'resume-based': [
    'Looking at your resume, you listed a key project. Can you explain your exact individual contribution?',
    'You mentioned proficiency in this programming language. Can you discuss memory management or concurrency in it?',
    'Which certification or extracurricular achievement listed on your resume taught you the most valuable practical lesson?',
    'Can you walk me through the hardest technical concept you had to master for your coursework?',
    'How have you kept your technical skills updated outside of the standard college curriculum?',
  ],
  'communication-rounds': [
    'In two minutes, persuade our college leadership why students should be allowed to contribute to open source during lab hours.',
    'Summarize a complex technical topic you learned this semester in under 90 seconds so that a non-technical manager understands it.',
    'You disagree with a senior engineer’s design proposal. How would you structure your communication to share your counter-proposal politely and persuasively?',
    'Explain how you would handle an angry or frustrated client whose application went down during a demo.',
    'Deliver a short closing statement articulating why effective communication is vital for modern software engineers.',
  ],
  'full-mock-interview': [
    'Welcome! Let us begin with your introductory pitch: introduce yourself and highlight your key technical achievements.',
    'Walk me through your most complex project, including system design choices and personal code contributions.',
    'Explain how you evaluate the time and space complexity of an algorithm using Big-O notation.',
    'Tell me about a time when you made a technical mistake. What happened, and how did you rectify it?',
    'How do you handle disagreement during a code review when you believe your approach is cleaner?',
    'How do you stay motivated and productive when debugging a problem that persists for days?',
    'Why are you excited about this specific role and organization?',
    'What questions do you have for the hiring team today?',
  ],
}

interface SessionDetail {
  id?: string
  targetRole?: string
  rubricVersion?: string
  turns?: Turn[]
}

export default function InterviewSessionPage() {
  const params = useParams()
  const router = useRouter()
  const trackSlug = String(params?.track || 'hr-interviews')
  const sessionId = String(params?.id || '')

  const [loadingSession, setLoadingSession] = useState(true)
  const [submittingTurn, setSubmittingTurn] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [sessionData, setSessionData] = useState<SessionDetail | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationData | null>(null)
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 1. Load Session Data
  useEffect(() => {
    let mounted = true
    async function fetchSession() {
      try {
        const res = await fetch(`/api/speakverse/v1/sessions/${sessionId}`)
        if (!res.ok) throw new Error('Session not found')
        const data = await res.json()
        if (mounted) {
          setSessionData(data)
          if (data.turns) {
            setTurns(data.turns)
            // Check if latest user turn has evaluation
            const userTurns = data.turns.filter((t: Turn) => t.speaker === 'user')
            const lastUserTurn = userTurns[userTurns.length - 1]
            if (lastUserTurn?.evaluationJson) {
              try {
                setCurrentEvaluation(JSON.parse(lastUserTurn.evaluationJson))
              } catch {}
            }
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load session:', err)
        toast.error('Could not load interview session')
      } finally {
        if (mounted) setLoadingSession(false)
      }
    }
    fetchSession()
    return () => {
      mounted = false
    }
  }, [sessionId])

  // 2. Timer
  useEffect(() => {
    if (loadingSession || finishing) return
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [loadingSession, finishing])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Determine questions bank
  const questionsList = TRACK_QUESTION_BANKS[trackSlug] || TRACK_QUESTION_BANKS['hr-interviews']
  const userTurnCount = turns.filter((t) => t.speaker === 'user').length
  const totalQuestions = Math.min(questionsList.length, 7)
  const currentQuestionIndex = Math.min(userTurnCount, totalQuestions - 1)

  // Get current prompt: either from last AI turn or questions bank
  const aiTurns = turns.filter((t) => t.speaker === 'ai')
  const latestAiTurn = aiTurns[aiTurns.length - 1]
  const currentQuestionText =
    latestAiTurn?.transcript || questionsList[currentQuestionIndex] || 'Please share your thoughts on this question.'

  const isImmediateFeedback =
    sessionData?.rubricVersion?.includes('immediate') || false

  // Handle Answer Submission
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please enter an answer before submitting.')
      return
    }

    setSubmittingTurn(true)
    try {
      const res = await fetch(`/api/speakverse/v1/sessions/${sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentAnswer.trim(),
          feedbackMode: isImmediateFeedback ? 'immediate' : 'end_of_session',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Failed to submit response')
      }

      const data = await res.json()
      const newTurns = [...turns, data.userTurn, data.aiTurn].filter(Boolean)
      setTurns(newTurns)
      setCurrentAnswer('')

      if (data.evaluation) {
        setCurrentEvaluation(data.evaluation)
        toast.success('Answer evaluated! Review your formative feedback below.')
      } else {
        toast.success('Answer recorded.')
      }
    } catch (err: unknown) {
      console.error('Submit turn error:', err)
      const message = err instanceof Error ? err.message : 'Error submitting answer'
      toast.error(message)
    } finally {
      setSubmittingTurn(false)
    }
  }

  // Handle End Interview
  const handleEndInterview = async () => {
    setFinishing(true)
    try {
      const res = await fetch(`/api/speakverse/v1/sessions/${sessionId}/finish`, {
        method: 'POST',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || 'Failed to finish interview')
      }

      const data = await res.json()
      toast.success('Interview complete! Preparing your performance report...')

      // Redirect to results page
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
      } else {
        router.push(`/speakverse/session/${sessionId}/results`)
      }
    } catch (err: unknown) {
      console.error('Finish interview error:', err)
      const message = err instanceof Error ? err.message : 'Could not finalize interview'
      toast.error(message)
      setFinishing(false)
      setShowConfirmEnd(false)
    }
  }

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 text-sv-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-sv-text-secondary">Setting up your interview arena session...</p>
      </div>
    )
  }

  const isCompleted = userTurnCount >= totalQuestions

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Bar: Progress, Timer, End Interview */}
      <div className="bg-sv-surface border border-sv-border rounded-sv p-4 shadow-sv-card flex flex-wrap items-center justify-between gap-4 sticky top-16 z-10">
        <div className="flex items-center gap-3">
          <Badge variant="info">
            Question {Math.min(userTurnCount + 1, totalQuestions)} of {totalQuestions}
          </Badge>
          <span className="text-xs text-sv-text-secondary font-medium">
            Role: {sessionData?.targetRole || 'Software Engineer'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-sv-text bg-gray-50 px-3 py-1.5 rounded-lg border border-sv-border">
            <Clock className="h-4 w-4 text-sv-primary" aria-hidden="true" />
            <span aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirmEnd(true)}
            className="text-sv-error hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
            End Interview
          </Button>
        </div>

        <div className="w-full pt-1">
          <Progress
            value={(userTurnCount / totalQuestions) * 100}
            size="sm"
            label="Interview Completion"
            showValue
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sv-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sv-warning font-semibold">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              <span>Conclude Interview Early?</span>
            </div>
            <p className="text-sm text-sv-text-secondary">
              Are you sure you want to end this interview now? A full performance report will still be generated based on your answers submitted so far.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmEnd(false)}
                disabled={finishing}
              >
                Continue Interview
              </Button>
              <Button
                variant="danger"
                loading={finishing}
                onClick={handleEndInterview}
              >
                Yes, Finalize Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <Card className="border-sv-border shadow-sv-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-sv-primary uppercase tracking-wide">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Interviewer Question
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-sv-text mt-1 leading-snug">
            {currentQuestionText}
          </CardTitle>
          <CardDescription className="text-xs text-sv-text-secondary">
            Take a moment to formulate your thoughts using structured STAR points (Situation, Task, Action, Result).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {!isCompleted ? (
            <div>
              <label htmlFor="answer-input" className="block text-sm font-medium text-sv-text mb-2">
                Your Spoken or Written Response
              </label>
              <textarea
                id="answer-input"
                ref={textareaRef}
                rows={7}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your response here clearly in English... (Tip: Structure your thoughts with context, actions you took, and specific results)"
                className="w-full p-3.5 text-sm sm:text-base border border-sv-border rounded-lg bg-sv-surface text-sv-text placeholder:text-sv-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-sv-primary focus:border-transparent min-h-[160px]"
                aria-describedby="response-hint word-counter"
                disabled={submittingTurn}
              />
              <div className="flex items-center justify-between text-xs text-sv-text-secondary mt-1 px-1">
                <span id="response-hint">Every answer provides formative skill evidence.</span>
                <span id="word-counter">
                  {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0} words
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-sv p-6 text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-sv-success mx-auto" aria-hidden="true" />
              <h3 className="text-lg font-bold text-sv-text">All Interview Questions Completed!</h3>
              <p className="text-sm text-sv-text-secondary max-w-md mx-auto">
                Excellent effort. Click below to generate your comprehensive performance report and skill scores.
              </p>
              <Button
                size="lg"
                loading={finishing}
                onClick={handleEndInterview}
                className="font-semibold mt-2"
              >
                Generate Final Performance Report
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Button>
            </div>
          )}
        </CardContent>

        {!isCompleted && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <span className="text-xs text-sv-text-secondary">
              Voice fallback: typed text is graded on identical communication criteria.
            </span>
            <Button
              onClick={handleSubmitAnswer}
              loading={submittingTurn}
              disabled={!currentAnswer.trim()}
              className="w-full sm:w-auto font-medium"
            >
              <Send className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Submit Answer
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Immediate AI Feedback Panel (If enabled) */}
      {isImmediateFeedback && currentEvaluation && (
        <Card className="border-sv-primary/30 bg-blue-50/30 shadow-sv-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <CardTitle className="text-base font-bold text-sv-text">
                  AI Formative Evaluation for Question {userTurnCount}
                </CardTitle>
              </div>
              <Badge variant="info">Formative Coaching</Badge>
            </div>
            {currentEvaluation.summary && (
              <p className="text-sm text-sv-text mt-2 font-medium">
                {currentEvaluation.summary}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Criteria Scores */}
            {currentEvaluation.scores && currentEvaluation.scores.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-sv-text-secondary tracking-wide">
                  Communication Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentEvaluation.scores.map((sc) => (
                    <div key={sc.criterion} className="bg-white p-2.5 rounded-lg border border-sv-border">
                      <div className="flex justify-between text-xs font-medium text-sv-text mb-1">
                        <span>{sc.criterion}</span>
                        <span className="text-sv-primary font-bold">{sc.score} / {sc.maxScore}</span>
                      </div>
                      <Progress value={(sc.score / sc.maxScore) * 100} size="sm" />
                      <p className="text-[11px] text-sv-text-secondary mt-1">{sc.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentEvaluation.strengths && (
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sv-success mb-1">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Key Strengths
                  </div>
                  <ul className="text-xs text-sv-text-secondary space-y-1 list-disc list-inside">
                    {currentEvaluation.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentEvaluation.improvement && (
                <div className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sv-warning mb-1">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Improvement Priority
                  </div>
                  <p className="text-xs text-sv-text-secondary">
                    {currentEvaluation.improvement}
                  </p>
                </div>
              )}
            </div>

            {/* Corrections */}
            {currentEvaluation.corrections && currentEvaluation.corrections.length > 0 && (
              <div className="bg-white p-3 rounded-lg border border-sv-border space-y-2">
                <span className="text-xs font-semibold text-sv-text uppercase tracking-wide">
                  Recommended Refinement
                </span>
                {currentEvaluation.corrections.map((corr, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <div className="text-sv-error line-through">{corr.original}</div>
                    <div className="text-sv-success font-medium flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 inline" /> {corr.corrected}
                    </div>
                    <p className="text-sv-text-secondary text-[11px] italic">{corr.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="text-[11px] text-sv-text-secondary/80 border-t border-sv-border/60 pt-2">
              <strong>Formative Notice:</strong> AI scores reflect automated practice observations and are designed to guide learning, not verify formal language proficiency.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answer History Accordion / List */}
      {turns.length > 1 && (
        <Card className="border-sv-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-sv-text">
              Session Conversation History ({turns.length} turns)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-1 max-h-60 overflow-y-auto">
            {turns.map((t) => (
              <div
                key={t.id || t.turnNumber}
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  t.speaker === 'user'
                    ? 'bg-blue-50 border border-blue-100 ml-4'
                    : 'bg-gray-50 border border-gray-200 mr-4'
                }`}
              >
                <span className="font-semibold block mb-1 text-sv-text">
                  {t.speaker === 'user' ? 'You (Candidate)' : 'SpeakVerse Interviewer'}
                </span>
                <p className="text-sv-text-secondary whitespace-pre-wrap">{t.transcript}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
