'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Mic, MicOff, Volume2, ArrowRight, CheckCircle2,
  BookOpen, Brain, Sparkles, AlertCircle, FileText, Check
} from 'lucide-react'
import { toast } from 'sonner'

export default function AssessmentPage() {
  const router = useRouter()
  const [sectionIndex, setSectionIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Section 1: Grammar (Sentence Reorder)
  const [grammarWords, setGrammarWords] = useState(['am', 'computer', 'science', 'I', 'studying'])
  const [grammarSelected, setGrammarSelected] = useState<string[]>([])

  // Section 2: Vocabulary
  const [vocabSelected, setVocabSelected] = useState<string | null>(null)

  // Section 3: Reading
  const [readingSelected, setReadingSelected] = useState<string | null>(null)

  // Section 4: Listening
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [listeningSelected, setListeningSelected] = useState<string | null>(null)

  // Section 5: Short Writing
  const [writingText, setWritingText] = useState('')

  // Section 6: Speaking / Text Fallback
  const [speakingMode, setSpeakingMode] = useState<'voice' | 'text'>('voice')
  const [isRecording, setIsRecording] = useState(false)
  const [spokenTranscript, setSpokenTranscript] = useState('')

  // Result scores
  const [finalScores, setFinalScores] = useState<any>(null)

  const sections = [
    { id: 'grammar', title: 'Grammar & Syntax', icon: Brain },
    { id: 'vocab', title: 'Vocabulary & Context', icon: BookOpen },
    { id: 'reading', title: 'Reading Comprehension', icon: FileText },
    { id: 'listening', title: 'Listening Comprehension', icon: Volume2 },
    { id: 'writing', title: 'Short Writing & Structure', icon: Sparkles },
    { id: 'speaking', title: 'Spoken Communication', icon: Mic },
  ]

  const handleWordClick = (word: string) => {
    setGrammarSelected(prev => [...prev, word])
    setGrammarWords(prev => {
      const idx = prev.indexOf(word)
      if (idx === -1) return prev
      const copy = [...prev]
      copy.splice(idx, 1)
      return copy
    })
  }

  const handleResetGrammar = () => {
    setGrammarWords(['am', 'computer', 'science', 'I', 'studying'])
    setGrammarSelected([])
  }

  const simulateSpeechAudio = () => {
    setIsPlayingAudio(true)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Hi team, just a quick update: we have resolved the server latency issue and our API response times are now back to normal."
      )
      utterance.rate = 0.95
      utterance.onend = () => setIsPlayingAudio(false)
      utterance.onerror = () => setIsPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000)
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      // Check if browser SpeechRecognition is available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((res: any) => res[0].transcript)
            .join(' ')
          setSpokenTranscript(transcript)
        }
        recognition.onend = () => setIsRecording(false)
        recognition.onerror = () => setIsRecording(false)
        recognition.start()
      } else {
        // Fallback simulation
        setTimeout(() => {
          setSpokenTranscript("Hello, my name is student and I am excited to improve my communication skills.")
          setIsRecording(false)
          toast.info('Simulated voice recording captured')
        }, 3000)
      }
    } else {
      setIsRecording(false)
    }
  }

  const handleNextSection = () => {
    if (sectionIndex < sections.length - 1) {
      setSectionIndex(prev => prev + 1)
    } else {
      finishAssessment()
    }
  }

  const finishAssessment = async () => {
    setSubmitting(true)

    // Compute formative scores
    const grammarCorrect = grammarSelected.join(' ').toLowerCase() === 'i am studying computer science'
    const vocabCorrect = vocabSelected === 'collaborate'
    const readingCorrect = readingSelected === 'b'
    const listeningCorrect = listeningSelected === 'a'
    const writingScore = Math.min(100, Math.max(50, writingText.trim().split(/\s+/).length * 4))
    const speakingScore = spokenTranscript.trim().length > 15 ? 85 : 70

    const scores = {
      grammar: grammarCorrect ? 95 : 65,
      vocabulary: vocabCorrect ? 90 : 60,
      reading: readingCorrect ? 90 : 70,
      listening: listeningCorrect ? 95 : 65,
      writing: writingScore,
      speaking: speakingScore,
    }

    const totalAvg = Object.values(scores).reduce((a, b) => a + b, 0) / 6
    let assessedLevel = 'A2'
    if (totalAvg >= 85) assessedLevel = 'B2'
    else if (totalAvg >= 75) assessedLevel = 'B1'
    else if (totalAvg >= 60) assessedLevel = 'A2'
    else assessedLevel = 'A1'

    try {
      const res = await fetch('/api/speakverse/v1/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores, level: assessedLevel }),
      })

      if (res.ok) {
        setFinalScores({ scores, level: assessedLevel, totalAvg: Math.round(totalAvg) })
        setCompleted(true)
      } else {
        toast.error('Failed to submit assessment results')
      }
    } catch {
      toast.error('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  if (completed && finalScores) {
    return (
      <div className="min-h-screen bg-sv-bg py-12 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <Card padding="lg">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-green-100 text-sv-success mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-sv-text">Baseline Assessment Completed!</h1>
              <p className="text-sm text-sv-text-secondary mt-1">
                Here is your formative communication diagnostic.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-sv p-6 mb-6 text-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-sv-text-secondary">
                Assessed Starting Level
              </span>
              <div className="text-4xl font-extrabold text-sv-primary my-2">
                Level {finalScores.level}
              </div>
              <p className="text-sm text-sv-text-secondary max-w-md mx-auto">
                {finalScores.level === 'B1' || finalScores.level === 'B2'
                  ? 'Strong foundational grammar and vocabulary. You are ready to accelerate into workplace conversation and mock interviews!'
                  : 'Good foundation with clear growth potential. We will build your sentence confidence and speaking rhythm step by step.'}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-sv-text">Formative Skill Diagnostic</h3>
              {Object.entries(finalScores.scores).map(([skill, val]: [string, any]) => (
                <div key={skill}>
                  <div className="flex justify-between text-xs text-sv-text-secondary capitalize mb-1">
                    <span>{skill}</span>
                    <span className="font-semibold text-sv-text">{val}%</span>
                  </div>
                  <Progress value={val} size="sm" color="primary" />
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-sv-warning mb-6">
              <strong>Formative Feedback Notice:</strong> This score is an initial diagnostic designed to adapt your daily lessons and is not a certified CEFR qualification.
            </div>

            <Button
              size="lg"
              fullWidth
              onClick={() => router.push('/speakverse/home')}
            >
              Continue to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const currentSection = sections[sectionIndex]
  const CurrentIcon = currentSection.icon

  return (
    <div className="min-h-screen bg-sv-bg py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-sv-text-secondary mb-2">
            <span className="font-semibold text-sv-primary">
              Section {sectionIndex + 1} of {sections.length}: {currentSection.title}
            </span>
            <span>{Math.round(((sectionIndex + 1) / sections.length) * 100)}%</span>
          </div>
          <Progress value={((sectionIndex + 1) / sections.length) * 100} size="sm" color="primary" />
        </div>

        <Card padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-sv-primary">
                <CurrentIcon className="h-5 w-5" />
              </div>
              <Badge variant="info">Diagnostic</Badge>
            </div>
            <CardTitle>{currentSection.title}</CardTitle>
            <CardDescription>
              Answer to the best of your ability. There is no penalty for incorrect answers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* SECTION 1: GRAMMAR */}
            {sectionIndex === 0 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-sv-text">
                  Reorder the words to form a grammatically correct sentence:
                </p>

                {/* Drop target */}
                <div className="min-h-[56px] p-3 rounded-lg border-2 border-dashed border-sv-primary/40 bg-blue-50/50 flex flex-wrap gap-2 items-center">
                  {grammarSelected.length === 0 ? (
                    <span className="text-xs text-sv-text-secondary italic">
                      Click the words below in order
                    </span>
                  ) : (
                    grammarSelected.map((word, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-sv-primary text-white text-sm font-medium rounded-lg shadow-sm"
                      >
                        {word}
                      </span>
                    ))
                  )}
                </div>

                {/* Available words */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {grammarWords.map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleWordClick(word)}
                      className="px-4 py-2 bg-white border border-sv-border rounded-lg text-sm font-medium text-sv-text hover:border-sv-primary hover:bg-blue-50 transition-colors min-h-[44px]"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {grammarSelected.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetGrammar}
                    className="text-xs text-sv-text-secondary hover:text-sv-error underline"
                  >
                    Reset sentence
                  </button>
                )}
              </div>
            )}

            {/* SECTION 2: VOCABULARY */}
            {sectionIndex === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-sv-text">
                  Choose the word that best completes the professional sentence:
                </p>
                <div className="p-4 bg-gray-50 border border-sv-border rounded-lg text-sm text-sv-text">
                  &ldquo;To succeed in high-performing engineering teams, engineers must{' '}
                  <span className="font-bold text-sv-primary underline decoration-2">________</span>{' '}
                  effectively across different time zones.&rdquo;
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'collaborate', label: 'collaborate', desc: 'Work jointly on an activity or project' },
                    { id: 'isolate', label: 'isolate', desc: 'Remain alone or separated' },
                    { id: 'hesitate', label: 'hesitate', desc: 'Pause before saying or doing something' },
                    { id: 'speculate', label: 'speculate', desc: 'Form a theory without firm evidence' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVocabSelected(opt.id)}
                      className={`w-full p-3.5 text-left rounded-lg border transition-all flex items-center justify-between min-h-[44px] ${
                        vocabSelected === opt.id
                          ? 'border-sv-primary bg-blue-50 text-sv-primary font-medium'
                          : 'border-sv-border bg-white hover:bg-gray-50 text-sv-text'
                      }`}
                    >
                      <div>
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-xs text-sv-text-secondary ml-2">— {opt.desc}</span>
                      </div>
                      {vocabSelected === opt.id && <Check className="h-4 w-4 text-sv-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: READING */}
            {sectionIndex === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg text-sm leading-relaxed text-sv-text">
                  <h4 className="font-semibold mb-1 text-sv-primary">Campus Placement Notice:</h4>
                  &ldquo;Candidates shortlisted for Round 2 must report to Seminar Hall A by 9:30 AM with three physical copies of their updated resume and college identity card. Formal attire is strictly mandatory. Late arrivals will forfeit their interview slot.&rdquo;
                </div>
                <p className="text-sm font-medium text-sv-text">
                  According to the notice, what will happen if a candidate arrives after 9:30 AM?
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'a', label: 'They will be rescheduled for the afternoon session.' },
                    { id: 'b', label: 'They will lose their interview opportunity entirely.' },
                    { id: 'c', label: 'They can still enter if they have three copies of their resume.' },
                    { id: 'd', label: 'They must get permission from the placement officer.' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReadingSelected(opt.id)}
                      className={`w-full p-3.5 text-left rounded-lg border transition-all flex items-center justify-between min-h-[44px] ${
                        readingSelected === opt.id
                          ? 'border-sv-primary bg-blue-50 text-sv-primary font-medium'
                          : 'border-sv-border bg-white hover:bg-gray-50 text-sv-text'
                      }`}
                    >
                      <span className="text-sm">{opt.label}</span>
                      {readingSelected === opt.id && <Check className="h-4 w-4 text-sv-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: LISTENING */}
            {sectionIndex === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-sv-text">
                  Listen to the workplace audio clip, then answer the question:
                </p>

                <div className="p-4 bg-gray-50 border border-sv-border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={simulateSpeechAudio}
                      disabled={isPlayingAudio}
                      className="gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      {isPlayingAudio ? 'Playing clip...' : 'Play Audio Clip'}
                    </Button>
                    <span className="text-xs text-sv-text-secondary">
                      English (Professional Workplace) · 5 sec
                    </span>
                  </div>
                </div>

                <div className="text-xs text-sv-text-secondary italic">
                  Transcript fallback: &ldquo;Hi team, just a quick update: we have resolved the server latency issue and our API response times are now back to normal.&rdquo;
                </div>

                <p className="text-sm font-medium text-sv-text pt-2">
                  What was the main outcome announced in the message?
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'a', label: 'API performance issues were resolved successfully.' },
                    { id: 'b', label: 'The server requires immediate maintenance.' },
                    { id: 'c', label: 'The team will schedule an outage tomorrow.' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setListeningSelected(opt.id)}
                      className={`w-full p-3.5 text-left rounded-lg border transition-all flex items-center justify-between min-h-[44px] ${
                        listeningSelected === opt.id
                          ? 'border-sv-primary bg-blue-50 text-sv-primary font-medium'
                          : 'border-sv-border bg-white hover:bg-gray-50 text-sv-text'
                      }`}
                    >
                      <span className="text-sm">{opt.label}</span>
                      {listeningSelected === opt.id && <Check className="h-4 w-4 text-sv-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: WRITING */}
            {sectionIndex === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-sv-text">
                  Write a 2 to 3 sentence reply to an email from a recruiter acknowledging their interview invitation:
                </p>
                <div className="p-3 bg-gray-50 border border-sv-border rounded-lg text-xs text-sv-text-secondary">
                  <strong>Recruiter Email:</strong> &ldquo;Dear Candidate, we would like to invite you for a 30-minute technical interview this Thursday at 2:00 PM. Please confirm if this time suits you.&rdquo;
                </div>
                <div>
                  <textarea
                    rows={4}
                    value={writingText}
                    onChange={e => setWritingText(e.target.value)}
                    placeholder="Dear HR Team, Thank you for this opportunity. I confirm my availability for Thursday at 2:00 PM..."
                    className="w-full p-3 text-sm border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary"
                  />
                  <div className="flex justify-between text-xs text-sv-text-secondary mt-1">
                    <span>Aim for 20–40 words</span>
                    <span>{writingText.trim() ? writingText.trim().split(/\s+/).length : 0} words</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: SPEAKING WITH TEXT FALLBACK */}
            {sectionIndex === 5 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-sv-text">
                    Prompt: &ldquo;Introduce yourself in 30 seconds (your name, branch of study, and one technical project).&rdquo;
                  </p>
                  <div className="flex rounded-lg border border-sv-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setSpeakingMode('voice')}
                      className={`px-3 py-1 font-medium ${
                        speakingMode === 'voice' ? 'bg-sv-primary text-white' : 'bg-white text-sv-text-secondary'
                      }`}
                    >
                      Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeakingMode('text')}
                      className={`px-3 py-1 font-medium ${
                        speakingMode === 'text' ? 'bg-sv-primary text-white' : 'bg-white text-sv-text-secondary'
                      }`}
                    >
                      Text Fallback
                    </button>
                  </div>
                </div>

                {speakingMode === 'voice' ? (
                  <div className="p-6 bg-gray-50 border border-sv-border rounded-sv text-center space-y-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-red-600 text-white recording-pulse ring-4 ring-red-200'
                            : 'bg-sv-primary text-white hover:bg-sv-primary-hover shadow-md'
                        }`}
                        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                      >
                        {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                      </button>
                    </div>

                    <div className="text-sm font-semibold text-sv-text">
                      {isRecording ? 'Listening... Speak now' : 'Click microphone to record your response'}
                    </div>

                    {spokenTranscript && (
                      <div className="p-3 bg-white border border-sv-border rounded-lg text-left text-xs text-sv-text">
                        <span className="font-semibold text-sv-primary">Captured transcript:</span> &ldquo;{spokenTranscript}&rdquo;
                      </div>
                    )}

                    <p className="text-xs text-sv-text-secondary">
                      No microphone? Switch to <strong>Text Fallback</strong> at the top right anytime.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-sv-text-secondary">
                      Type what you would say:
                    </label>
                    <textarea
                      rows={4}
                      value={spokenTranscript}
                      onChange={e => setSpokenTranscript(e.target.value)}
                      placeholder="Hello, I am a final-year Computer Science student at..."
                      className="w-full p-3 text-sm border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Next / Submit buttons */}
            <div className="pt-4 border-t border-sv-border flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                disabled={sectionIndex === 0 || submitting}
                onClick={() => setSectionIndex(prev => prev - 1)}
              >
                Previous
              </Button>

              <Button
                type="button"
                size="md"
                loading={submitting}
                onClick={handleNextSection}
              >
                {sectionIndex === sections.length - 1 ? 'Complete Assessment' : 'Next Section'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
