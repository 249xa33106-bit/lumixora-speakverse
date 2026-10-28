'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Zap, CheckCircle2, Mic, ArrowRight, ArrowLeft, Globe, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    college: '',
    degree: '',
    targetRole: '',
    targetDate: '',
    learningGoal: 'interview',
    explanationLanguage: 'en',
    dailyGoalMinutes: 10,
    selfAssessedLevel: 'A2',
    micConsent: true,
  })

  const update = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFinish = async (skipAssessment = false) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/speakverse/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName || undefined,
          college: formData.college || undefined,
          degree: formData.degree || undefined,
          targetRole: formData.targetRole || undefined,
          learningGoal: formData.learningGoal,
          explanationLanguage: formData.explanationLanguage,
          dailyGoalMinutes: Number(formData.dailyGoalMinutes),
          targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : null,
          selfAssessedLevel: formData.selfAssessedLevel,
          onboardingComplete: true,
        }),
      })

      if (!res.ok) {
        toast.error('Failed to save preferences. Please try again.')
        setSubmitting(false)
        return
      }

      toast.success('Profile setup complete!')
      if (skipAssessment) {
        router.push('/speakverse/home')
      } else {
        router.push('/speakverse/assessment')
      }
      router.refresh()
    } catch (err) {
      toast.error('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-sv-bg py-12 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-2xl text-sv-text mb-2">
            <Zap className="h-6 w-6 text-sv-primary" aria-hidden="true" />
            <span>LUMIXORA <span className="text-sv-primary">SpeakVerse</span></span>
          </div>
          <h1 className="text-xl font-bold text-sv-text">Personalize Your Learning Path</h1>
          <p className="text-sm text-sv-text-secondary mt-1">Step {step} of 3</p>
          <div className="mt-4 max-w-xs mx-auto">
            <Progress value={(step / 3) * 100} size="sm" color="primary" />
          </div>
        </div>

        <Card padding="lg">
          {/* STEP 1: Academic & Target Career */}
          {step === 1 && (
            <div>
              <CardHeader>
                <CardTitle>Academic & Career Focus</CardTitle>
                <CardDescription>
                  Tell us about your background so we can tailor interview scenarios and vocabulary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Preferred Name / Display Name"
                  placeholder="e.g. Ananya"
                  value={formData.displayName}
                  onChange={e => update('displayName', e.target.value)}
                />
                <Input
                  label="College or University"
                  placeholder="e.g. JNTU Hyderabad / Osmania University"
                  value={formData.college}
                  onChange={e => update('college', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Degree & Branch"
                    placeholder="e.g. B.Tech Computer Science"
                    value={formData.degree}
                    onChange={e => update('degree', e.target.value)}
                  />
                  <Input
                    label="Target Job Role"
                    placeholder="e.g. Software Engineer / Data Analyst"
                    value={formData.targetRole}
                    onChange={e => update('targetRole', e.target.value)}
                  />
                </div>
                <Input
                  label="Target Placement / Interview Date (Optional)"
                  type="date"
                  hint="We will adjust your practice timeline to prepare you on time"
                  value={formData.targetDate}
                  onChange={e => update('targetDate', e.target.value)}
                />
                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    size="md"
                    onClick={() => setStep(2)}
                  >
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 2: Learning Goals & Language Mode */}
          {step === 2 && (
            <div>
              <CardHeader>
                <CardTitle>Your Learning Goals & Habits</CardTitle>
                <CardDescription>
                  Choose how and what you want to practice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-sv-text mb-2">
                    Primary Objective
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'interview', label: 'Campus Placements & Interviews', desc: 'HR questions, tech intro, behavioral answers' },
                      { id: 'fluency', label: 'Everyday Fluency', desc: 'Comfortable speaking with friends & colleagues' },
                      { id: 'presentation', label: 'Seminars & Presentations', desc: 'Classroom talks, slide narration, Q&A' },
                      { id: 'workplace', label: 'Corporate & Workplace English', desc: 'Meetings, emails, client conversations' },
                    ].map(goal => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => update('learningGoal', goal.id)}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          formData.learningGoal === goal.id
                            ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/30'
                            : 'border-sv-border bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-sm text-sv-text">{goal.label}</div>
                        <div className="text-xs text-sv-text-secondary mt-1">{goal.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sv-text mb-2">
                    Explanation Language Support
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => update('explanationLanguage', 'en')}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        formData.explanationLanguage === 'en'
                          ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/30'
                          : 'border-sv-border bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-sm text-sv-text flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-sv-primary" /> English Only
                      </div>
                      <div className="text-xs text-sv-text-secondary mt-1">Full immersion in standard English.</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => update('explanationLanguage', 'te_en')}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        formData.explanationLanguage === 'te_en'
                          ? 'border-sv-primary bg-blue-50 ring-2 ring-sv-primary/30'
                          : 'border-sv-border bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-sm text-sv-text flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-sv-accent" /> English + Telugu (తెలుగు)
                      </div>
                      <div className="text-xs text-sv-text-secondary mt-1">Grammar concepts explained in Telugu with English practice.</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sv-text mb-2">
                    Daily Practice Goal
                  </label>
                  <div className="flex gap-3">
                    {[5, 10, 15, 20].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => update('dailyGoalMinutes', mins)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border text-center transition-all ${
                          formData.dailyGoalMinutes === mins
                            ? 'bg-sv-primary text-white border-sv-primary'
                            : 'bg-white text-sv-text border-sv-border hover:bg-gray-50'
                        }`}
                      >
                        {mins} min/day
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                  >
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 3: Privacy & Getting Started */}
          {step === 3 && (
            <div>
              <CardHeader>
                <CardTitle>Permissions & Baseline Assessment</CardTitle>
                <CardDescription>
                  You are all set! Let&apos;s finalize your preferences before starting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mic className="h-5 w-5 text-sv-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-sv-text">Voice Practice Guarantee</h4>
                      <p className="text-xs text-sv-text-secondary mt-1">
                        Microphone access is only ever used during interactive speaking activities when you click record.
                        <strong> Every voice activity always has a typed text fallback option.</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                    <input
                      type="checkbox"
                      id="mic-consent"
                      checked={formData.micConsent}
                      onChange={e => update('micConsent', e.target.checked)}
                      className="rounded border-gray-300 text-sv-primary focus:ring-sv-primary"
                    />
                    <label htmlFor="mic-consent" className="text-xs text-sv-text">
                      I agree to allow SpeakVerse to evaluate my spoken responses and save learning progress.
                    </label>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-sv-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-sv-text">Formative Feedback Notice</h4>
                    <p className="text-xs text-sv-text-secondary mt-1">
                      AI evaluations are formative learning aids designed to help you practice and improve, not official CEFR accreditation.
                    </p>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    loading={submitting}
                    onClick={() => handleFinish(false)}
                  >
                    Start 5-Minute Baseline Assessment <ArrowRight className="h-4 w-4" />
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleFinish(true)}
                      className="text-xs text-sv-text-secondary hover:text-sv-primary hover:underline"
                    >
                      Skip assessment for now and go directly to Dashboard
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                </div>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
