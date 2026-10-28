'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  SquareCheck,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface MessageTurn {
  id?: string
  turnNumber: number
  speaker: 'user' | 'ai'
  transcript: string
  createdAt?: string
}

const MODE_DETAILS: Record<
  string,
  { title: string; scenario: string; goal: string; starters: string[] }
> = {
  guided: {
    title: 'Guided Conversation',
    scenario: 'Campus placement preparation: Introducing yourself and explaining your academic projects.',
    goal: 'Present your background with clear chronological flow and professional terminology.',
    starters: [
      'I am currently pursuing my degree in engineering.',
      'My core technical strengths include Python and system design.',
      'During my recent semester project, our team solved...',
    ],
  },
  free: {
    title: 'Free Conversation',
    scenario: 'Open casual discussion with SpeakVerse Coach on college life, tech developments, and aspirations.',
    goal: 'Practice spontaneous, fluid communication and natural transitions between ideas.',
    starters: [
      'I would like to discuss recent innovations in artificial intelligence.',
      'College campus life this semester has been quite busy with assignments.',
      'What are some practical habits for improving English vocabulary?',
    ],
  },
  scenario: {
    title: 'Scenario Role-play',
    scenario: 'Workplace Team Stand-up: Greeting your colleagues and updating them on your software deliverable.',
    goal: 'Adopt a confident, collaborative professional tone and answer colleague questions politely.',
    starters: [
      'Good morning everyone, here is a quick update from my end.',
      'I have resolved the database integration issue from yesterday.',
      'Today I will focus on unit testing before submitting the pull request.',
    ],
  },
  topic: {
    title: 'Speak from Topic',
    scenario: 'Delivering structured thoughts on: "How automation is transforming workplace opportunities."',
    goal: 'State a clear thesis, provide supporting arguments, and deliver a concise concluding thought.',
    starters: [
      'In my opinion, automation creates new high-value roles while shifting routine tasks.',
      'One major example of this transformation is in software testing.',
      'To conclude, continuous upskilling is the key for college graduates.',
    ],
  },
  challenge: {
    title: '1-Minute Challenge',
    scenario: 'Rapid speech challenge: Summarize a significant obstacle you overcame during your studies.',
    goal: 'Maintain steady pace without prolonged pauses, emphasizing the action you took and the outcome.',
    starters: [
      'A notable challenge I faced was preparing for semester exams while managing our symposium.',
      'I tackled this by scheduling three focused hours every morning.',
      'Ultimately, we completed both successfully with great peer feedback.',
    ],
  },
  pronunciation: {
    title: 'Pronunciation Practice',
    scenario: 'Intelligibility drill focusing on word stress, consonant clarity, and professional cadence.',
    goal: 'Practice clear articulation of multisyllabic professional words like "methodology" and "infrastructure".',
    starters: [
      'Clear articulation helps convey technical precision in interviews.',
      'Effective communication requires deliberate syllable stress and pacing.',
      'I am actively refining my spoken English intelligibility.',
    ],
  },
}

export default function SpeakModePage() {
  const params = useParams()
  const router = useRouter()
  const modeKey = (Array.isArray(params?.mode) ? params.mode[0] : params?.mode) || 'guided'
  const modeInfo = MODE_DETAILS[modeKey] || MODE_DETAILS.guided

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageTurn[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Initialize or fetch session
  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        setIsLoadingSession(true)
        setErrorMsg(null)

        const res = await fetch('/api/speakverse/v1/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionType: 'speak_studio',
            scenarioId: modeKey,
            difficulty: 'B1',
            inputMode: 'text',
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to start practice session')
        }

        const data = await res.json()
        if (mounted) {
          setSessionId(data.session.id)
          if (data.initialTurn) {
            setMessages([data.initialTurn])
          }
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || 'Could not connect to session service.')
        }
      } finally {
        if (mounted) {
          setIsLoadingSession(false)
        }
      }
    }

    initSession()

    return () => {
      mounted = false
    }
  }, [modeKey])

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // Handle message send
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!inputText.trim() || !sessionId || isSending || isFinishing) return

    const userUtterance = inputText.trim()
    setInputText('')
    setErrorMsg(null)
    setIsSending(true)

    const tempTurnNumber = messages.length + 1
    const optimisticTurn: MessageTurn = {
      turnNumber: tempTurnNumber,
      speaker: 'user',
      transcript: userUtterance,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticTurn])

    try {
      const res = await fetch(`/api/speakverse/v1/sessions/${sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userUtterance,
          feedbackMode: 'end_of_session',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to receive AI coach response')
      }

      const data = await res.json()
      if (data.aiTurn) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.turnNumber !== tempTurnNumber)
          return [...filtered, data.userTurn, data.aiTurn]
        })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with AI coach. Your attempt was saved.')
    } finally {
      setIsSending(false)
    }
  }

  // Handle ending session
  async function handleFinishSession() {
    if (!sessionId || isFinishing) return
    setIsFinishing(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/speakverse/v1/sessions/${sessionId}/finish`, {
        method: 'POST',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to finalize session')
      }

      const data = await res.json()
      router.push(data.redirectUrl || `/speakverse/session/${sessionId}/results`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate session results.')
      setIsFinishing(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DFE5EE] shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/speakverse/speak"
            className="p-2 rounded-xl text-[#596579] hover:text-[#17243A] hover:bg-[#F7F9FC] transition-colors focus:ring-2 focus:ring-[#2458A6]"
            aria-label="Back to Speak Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#2458A6]">
                Speak Studio
              </span>
              <span className="text-xs text-[#596579]">• Gemini 2.0 Flash Coach</span>
            </div>
            <h1 className="text-xl font-bold text-[#17243A] mt-0.5">{modeInfo.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFinishSession}
            disabled={isFinishing || messages.length <= 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#167D72] text-white hover:bg-[#13685f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm focus:ring-2 focus:ring-[#167D72] focus:ring-offset-2 min-h-[44px]"
          >
            {isFinishing ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <SquareCheck className="w-4 h-4" />
                End Session & View Feedback
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Context Card */}
      <div className="bg-[#F7F9FC] p-4 sm:p-5 rounded-2xl border border-[#DFE5EE] text-sm text-[#17243A] space-y-2">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#2458A6] mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-[#17243A]">Scenario: </span>
            <span className="text-[#596579]">{modeInfo.scenario}</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#167D72] mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-[#17243A]">Communication Goal: </span>
            <span className="text-[#596579]">{modeInfo.goal}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-[#B42332] flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="bg-white rounded-2xl border border-[#DFE5EE] shadow-sm flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoadingSession ? (
            <div className="h-full flex flex-col items-center justify-center text-[#596579] space-y-3">
              <Bot className="w-10 h-10 text-[#2458A6] animate-pulse" />
              <p className="text-sm font-medium">Connecting with SpeakVerse Coach...</p>
            </div>
          ) : (
            messages.map((turn, idx) => {
              const isAi = turn.speaker === 'ai'
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    isAi ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAi && (
                    <div className="w-9 h-9 rounded-xl bg-[#2458A6] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? 'bg-[#F7F9FC] text-[#17243A] border border-[#DFE5EE] rounded-tl-sm'
                        : 'bg-[#2458A6] text-white rounded-tr-sm shadow-sm'
                    }`}
                  >
                    <div className="text-[11px] font-semibold opacity-75 mb-1">
                      {isAi ? 'SpeakVerse Coach' : 'You'}
                    </div>
                    <p className="whitespace-pre-wrap">{turn.transcript}</p>
                  </div>

                  {!isAi && (
                    <div className="w-9 h-9 rounded-xl bg-[#167D72] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {isSending && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-9 h-9 rounded-xl bg-[#2458A6] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#F7F9FC] p-4 rounded-2xl rounded-tl-sm border border-[#DFE5EE] text-sm text-[#596579] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2458A6] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#2458A6] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#2458A6] animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[#596579] ml-1">Coach is typing...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Sentence Starters Scaffolding */}
        <div className="px-4 py-2.5 bg-[#F7F9FC] border-t border-[#DFE5EE] overflow-x-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-[#596579] shrink-0">Try saying:</span>
          {modeInfo.starters.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputText(starter)}
              className="text-xs text-[#2458A6] bg-white border border-[#DFE5EE] hover:border-[#2458A6] hover:bg-blue-50/50 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-[#DFE5EE] rounded-b-2xl flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your response in English..."
              disabled={isSending || isFinishing || isLoadingSession}
              aria-label="Your spoken response text"
              className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#DFE5EE] rounded-xl text-sm text-[#17243A] placeholder-[#596579] focus:outline-none focus:ring-2 focus:ring-[#2458A6] focus:bg-white transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending || isFinishing || isLoadingSession}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[#2458A6] text-white hover:bg-[#1a4280] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-[#2458A6] focus:ring-offset-2 min-h-[44px] shrink-0"
            aria-label="Send message to AI Coach"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Transcript Log Below */}
      <div className="bg-white rounded-2xl p-6 border border-[#DFE5EE] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#17243A]">Live Dialogue Transcript</h2>
          <span className="text-xs font-medium text-[#596579] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#167D72]" />
            Saved to sv_session_turns
          </span>
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto text-xs text-[#596579] divide-y divide-[#DFE5EE]">
          {messages.map((turn, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex items-start gap-3">
              <span className="font-semibold text-[#17243A] w-20 shrink-0">
                {turn.speaker === 'ai' ? 'Coach' : 'Learner'}:
              </span>
              <span className="text-[#17243A] flex-1">{turn.transcript}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
