'use client'
import { useState, useEffect, useTransition } from 'react'
import { X, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StationId } from './ClassroomScene'

interface ActivityPanelProps {
  station: StationId
  onClose: () => void
}

const STATION_CONFIG: Record<StationId, { title: string; color: string; emoji: string; description: string }> = {
  grammar:      { title: 'Grammar & Vocabulary',  color: '#2458A6', emoji: '📚', description: 'Practice sentence construction and vocabulary' },
  conversation: { title: 'Conversation Corner',   color: '#167D72', emoji: '💬', description: 'Practice everyday and professional English' },
  interview:    { title: 'Interview Room',         color: '#7C3AED', emoji: '🎯', description: 'Simulate HR and technical interviews' },
  presentation: { title: 'Presentation Stage',    color: '#9A6216', emoji: '🎤', description: 'Practice structured speaking on any topic' },
  listening:    { title: 'Listening Station',      color: '#18765A', emoji: '🎧', description: 'Improve comprehension with audio exercises' },
}

export function ActivityPanel({ station, onClose }: ActivityPanelProps) {
  const config = STATION_CONFIG[station]
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    { role: 'ai', text: getOpeningMessage(station) }
  ])
  const [isPending, startTransition] = useTransition()
  const [showTelugu, setShowTelugu] = useState(false)

  // Reset messages and session when station changes
  useEffect(() => {
    setMessages([{ role: 'ai', text: getOpeningMessage(station) }])
    setSessionId(null)
    setInput('')
  }, [station])

  async function handleSubmit() {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])

    startTransition(async () => {
      try {
        let currentSessionId = sessionId
        // Initialize session on first turn if not started yet
        if (!currentSessionId) {
          const sessionRes = await fetch('/api/speakverse/v1/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionType: station === 'conversation' ? 'conversation' : station,
              inputMode: 'text',
              difficulty: 'B1',
              openingMessage: getOpeningMessage(station),
            }),
          })
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json()
            currentSessionId = sessionData.id || sessionData.sessionId
            setSessionId(currentSessionId)
          }
        }

        // Post the user turn to receive the Gemini-powered response
        if (currentSessionId) {
          const turnRes = await fetch(`/api/speakverse/v1/sessions/${currentSessionId}/turns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: userMsg,
              transcript: userMsg,
              feedbackMode: 'immediate',
            }),
          })
          if (turnRes.ok) {
            const turnData = await turnRes.json()
            const aiText = turnData.aiTurn?.transcript || getContextualResponse(station, userMsg)
            setMessages(prev => [...prev, { role: 'ai', text: aiText }])
            return
          }
        }

        // Contextual fallback response if offline or unauthenticated
        const aiResponse = getContextualResponse(station, userMsg)
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
      } catch {
        const aiResponse = getContextualResponse(station, userMsg)
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-sv-surface border-l border-sv-border">
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-sv-border"
        style={{ borderTop: `3px solid ${config.color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
          <div>
            <h2 className="font-semibold text-sv-text text-sm">{config.title}</h2>
            <p className="text-xs text-sv-text-secondary">{config.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-sv-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary cursor-pointer"
          aria-label="Close activity panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Station-specific activity */}
      <div className="flex-1 overflow-y-auto p-4">
        {station === 'grammar' && <GrammarActivity />}
        {station === 'conversation' && (
          <ConversationActivity
            messages={messages}
            onShowTelugu={() => setShowTelugu(!showTelugu)}
            showTelugu={showTelugu}
          />
        )}
        {station === 'interview' && <InterviewActivity />}
        {station === 'presentation' && <PresentationActivity />}
        {station === 'listening' && <ListeningActivity />}
      </div>

      {/* Text input (always available fallback) */}
      <div className="border-t border-sv-border p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            placeholder="Type your answer or response here…"
            className="flex-1 text-sm border border-sv-border rounded-lg px-3 py-2 resize-none min-h-[44px] max-h-24 focus:outline-none focus:ring-2 focus:ring-sv-primary text-sv-text placeholder:text-sv-text-secondary/60"
            rows={2}
            aria-label="Your response"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isPending}
            loading={isPending}
            size="md"
            aria-label="Submit response"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-sv-text-secondary mt-1.5">
          🎙️ Voice input available in the Speak Studio —{' '}
          <a href="/speakverse/speak" className="text-sv-primary underline">open it</a>
        </p>
      </div>
    </div>
  )
}

// ---- Station-specific Activity Components ----

function GrammarActivity() {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const question = {
    prompt: 'Which sentence is grammatically correct?',
    options: [
      'I am study engineering.',
      'I study engineering.',
      'I studying engineering.',
      'I studies engineering.',
    ],
    correct: 1,
    explanation: 'Use simple present tense for regular activities. "I study" — subject + base verb.',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-sv-primary">Grammar · A1</span>
        <span className="text-xs text-sv-text-secondary">~2 min</span>
      </div>
      <p className="font-medium text-sv-text">{question.prompt}</p>
      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary cursor-pointer ${
              submitted && i === question.correct ? 'bg-green-50 border-sv-success text-sv-success font-medium' :
              submitted && selected === i && i !== question.correct ? 'bg-red-50 border-sv-error text-sv-error' :
              selected === i ? 'border-sv-primary bg-blue-50 text-sv-primary' :
              'border-sv-border bg-sv-surface hover:border-sv-primary hover:bg-blue-50 text-sv-text'
            }`}
            aria-pressed={selected === i}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        ))}
      </div>
      {!submitted ? (
        <Button onClick={() => selected !== null && setSubmitted(true)} disabled={selected === null} fullWidth>
          Check Answer
        </Button>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg text-sm ${
            selected === question.correct ? 'bg-green-50 border border-sv-success text-sv-success' : 'bg-red-50 border border-sv-error text-sv-error'
          }`}>
            <span className="font-semibold">{selected === question.correct ? '✓ Correct!' : '✗ Not quite.'}</span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-sv-text">
            <span className="font-semibold">Explanation:</span> {question.explanation}
          </div>
          <Button variant="secondary" fullWidth onClick={() => { setSelected(null); setSubmitted(false) }}>
            <RotateCcw className="h-4 w-4" /> Try Another
          </Button>
          <a href="/speakverse/grammar" className="block text-center text-sm text-sv-primary underline">
            Open full Grammar Lab →
          </a>
        </div>
      )}
    </div>
  )
}

function ConversationActivity({ messages, onShowTelugu, showTelugu }: {
  messages: Array<{ role: 'ai' | 'user'; text: string }>
  onShowTelugu: () => void
  showTelugu: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-sv-accent">Conversation · B1</span>
        <button onClick={onShowTelugu} className="text-xs text-sv-primary underline cursor-pointer">
          {showTelugu ? 'Hide' : 'Show'} Telugu help
        </button>
      </div>
      {showTelugu && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm telugu-text">
          మీరు ఇంగ్లీష్‌లో మీ గురించి చెప్పడానికి ప్రయత్నించండి. ఉదాహరణ: "I am studying computer science."
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start' }`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-sv-primary text-white rounded-br-sm'
                : 'bg-gray-100 text-sv-text rounded-bl-sm'
            }`}>
              {msg.role === 'ai' && <span className="font-semibold block text-xs mb-0.5 text-sv-text-secondary">SpeakVerse Coach</span>}
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <a href="/speakverse/speak" className="block text-center text-sm text-sv-primary underline">
        Open full Speak Studio with voice →
      </a>
    </div>
  )
}

function InterviewActivity() {
  return (
    <div className="space-y-4">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">Interview · B2</span>
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="font-semibold text-sv-text mb-1">Interview Question</p>
        <p className="text-sv-text text-sm">"Tell me about yourself and your current studies."</p>
      </div>
      <div className="text-xs text-sv-text-secondary">
        💡 Tip: Use the STAR structure — Situation, Task, Action, Result
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-sv-text">
        <strong>Framework:</strong><br />
        "I am currently pursuing [degree] at [college]. I have been focusing on [subject]. One project I'm proud of is [example]."
      </div>
      <a href="/speakverse/interview" className="block w-full">
        <button className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer">
          Open Full Interview Arena →
        </button>
      </a>
    </div>
  )
}

function PresentationActivity() {
  const topics = ['My college project', 'My career goal', 'A technology I use', 'My hometown', 'A challenge I overcame']
  const [topic, setTopic] = useState('')
  return (
    <div className="space-y-4">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-sv-warning">Presentation · B1</span>
      <p className="text-sm text-sv-text font-medium">Choose a topic to practise speaking about:</p>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary cursor-pointer ${
              topic === t ? 'bg-sv-warning text-white border-sv-warning' : 'bg-white border-sv-border text-sv-text hover:border-sv-warning'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {topic && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-semibold text-sv-text mb-1">Your topic: {topic}</p>
          <p className="text-sv-text-secondary">Speak or type for 1 minute. Cover: introduction, main point, example, conclusion.</p>
        </div>
      )}
      <a href="/speakverse/speak" className="block text-center text-sm text-sv-primary underline">
        Open Speak Studio for voice practice →
      </a>
    </div>
  )
}

function ListeningActivity() {
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-sv-success">Listening · A2</span>
      <div className="p-3 bg-green-50 border border-sv-success/30 rounded-lg">
        <p className="text-sm font-medium text-sv-text mb-1">Listen to the following (read carefully):</p>
        <p className="text-sm text-sv-text italic">
          "Good morning. My name is Priya and I am a final-year computer science student. I am looking for a software engineering internship."
        </p>
      </div>
      <p className="text-sm font-medium text-sv-text">What is Priya looking for?</p>
      <div className="space-y-2">
        {['A full-time job', 'A software internship', 'A college admission', 'A scholarship'].map((opt, i) => (
          <button
            key={i}
            onClick={() => !revealed && setSelected(i)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer ${
              revealed && i === 1 ? 'bg-green-50 border-sv-success text-sv-success font-medium' :
              selected === i && !revealed ? 'border-sv-primary bg-blue-50' :
              'border-sv-border hover:border-sv-primary text-sv-text'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!revealed ? (
        <Button onClick={() => setRevealed(true)} disabled={selected === null} fullWidth>Check Answer</Button>
      ) : (
        <div className="space-y-2">
          <div className={`p-3 rounded-lg text-sm ${ selected === 1 ? 'bg-green-50 border border-sv-success text-sv-success' : 'bg-red-50 border border-sv-error text-sv-error'}`}>
            {selected === 1 ? '✓ Correct! She said "software engineering internship".' : '✗ Listen again — she mentioned "internship".'}
          </div>
          <Button variant="secondary" fullWidth onClick={() => { setSelected(null); setRevealed(false) }}>
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      )}
      <a href="/speakverse/listening" className="block text-center text-sm text-sv-primary underline">
        Open full Listening Lab →
      </a>
    </div>
  )
}

// Helpers
function getOpeningMessage(station: StationId): string {
  const messages: Record<StationId, string> = {
    grammar:      "Welcome to Grammar & Vocabulary! Let's practise building correct English sentences. Type a sentence about yourself to begin.",
    conversation: "Hello! I'm your SpeakVerse conversation coach. Let's practise your English. Can you introduce yourself in one or two sentences?",
    interview:    "Welcome to the Interview Room. I'll ask you interview questions and give feedback on your English communication. Ready to start?",
    presentation: "Welcome to the Presentation Stage! Choose a topic above, then speak or type for about one minute. I'll give you feedback.",
    listening:    "Welcome to the Listening Station. Read the passage carefully, then answer the comprehension question below.",
  }
  return messages[station]
}

function getContextualResponse(station: StationId, userInput: string): string {
  if (userInput.length < 5) return 'Could you write a bit more? A complete sentence works best.'
  const responses: Record<StationId, string> = {
    grammar:      `Good attempt! Your sentence: "${userInput}". Check subject-verb agreement and tense. Try rewriting it with "I am" or "I study".`,
    conversation: `Thank you for sharing! That was a good start. Can you tell me more about your studies or your career goal?`,
    interview:    `Interesting answer. To improve it: start with your role/year, mention a key skill or achievement, and end with your goal. Try again?`,
    presentation: `Good start! To make it stronger: add one specific example or detail. What is one thing that makes this topic important to you?`,
    listening:    `Well done trying! Review the transcript above and check your answer. Would you like to try a harder question?`,
  }
  return responses[station]
}
