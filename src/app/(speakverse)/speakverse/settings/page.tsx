'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Languages,
  Bell,
  Eye,
  Shield,
  AlertTriangle,
  Download,
  Trash2,
  Info,
  RefreshCw,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

interface ConsentRecord {
  id: string
  purpose: string
  granted: boolean
  grantedAt: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Settings State
  const [explanationLanguage, setExplanationLanguage] = useState<'en' | 'te_en'>('en')
  const [recordingRetention, setRecordingRetention] = useState<'session' | '30_days'>('session')
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0)
  const [notifications, setNotifications] = useState<boolean>(true)
  const [reminderTime, setReminderTime] = useState<string>('18:00')
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(15)
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [highContrast, setHighContrast] = useState<boolean>(false)
  const [consents, setConsents] = useState<ConsentRecord[]>([])

  // Load Settings
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/speakverse/v1/profile')
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()

        if (data.profile) {
          setExplanationLanguage(data.profile.explanationLanguage || 'en')
          setDailyGoalMinutes(data.profile.dailyGoalMinutes || 15)
        }
        if (data.preferences) {
          setAudioSpeed(data.preferences.audioSpeed || 1.0)
          setNotifications(data.preferences.notifications ?? true)
          setReducedMotion(data.preferences.reducedMotion ?? false)
          setFontSize(data.preferences.fontSize || 'md')
          setHighContrast(data.preferences.highContrast ?? false)
        }
        if (data.consents) {
          setConsents(data.consents)
        }
      } catch (err: unknown) {
        console.error('Settings load error:', err)
        toast.error('Could not load existing settings')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Save Settings
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/speakverse/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          explanationLanguage,
          dailyGoalMinutes: Number(dailyGoalMinutes),
          recordingRetention,
          audioSpeed: Number(audioSpeed),
          notifications,
          reducedMotion,
          fontSize,
          highContrast,
        }),
      })

      if (!res.ok) throw new Error('Failed to save settings')
      const data = await res.json()
      if (data.consents) setConsents(data.consents)

      toast.success('Your preferences have been saved successfully.')
    } catch (err: unknown) {
      console.error('Settings save error:', err)
      const message = err instanceof Error ? err.message : 'Error saving settings'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // Withdraw Consent
  const handleWithdrawConsent = async (purpose: string) => {
    try {
      const res = await fetch('/api/speakverse/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawConsent: purpose }),
      })
      if (!res.ok) throw new Error('Failed to update consent')
      const data = await res.json()
      setConsents(data.consents || [])
      toast.success(`Consent for "${purpose}" withdrawn.`)
    } catch {
      toast.error('Could not withdraw consent')
    }
  }

  // Export Data
  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/speakverse/v1/profile/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `speakverse-student-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Data package exported successfully.')
    } catch {
      toast.error('Failed to export data package')
    } finally {
      setExporting(false)
    }
  }

  // Delete Account
  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/speakverse/v1/profile', {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Deletion failed')
      toast.success('Account and associated data deleted.')
      signOut({ callbackUrl: '/login' })
    } catch {
      toast.error('Could not delete account. Contact support.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 text-sv-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-sv-text-secondary">Loading your preferences...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-sv-primary">
            Account & System
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Platform Settings</h1>
        <p className="text-sv-text-secondary mt-1">
          Customize language explanations, audio preferences, reminders, accessibility options, and data privacy.
        </p>
      </div>

      {/* 1. Language & Explanations */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-sv-primary" />
            <CardTitle className="text-lg font-bold">1. Language & Pedagogical Explanations</CardTitle>
          </div>
          <CardDescription>
            Choose whether grammar breakdowns, vocabulary nuances, and syntax hints include bilingual Telugu support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-sv-border">
            <div>
              <span className="font-semibold text-sm text-sv-text block">
                Bilingual Telugu Explanations (తెలుగు వివరణలు)
              </span>
              <p className="text-xs text-sv-text-secondary mt-0.5">
                Displays Telugu grammatical analogies alongside English definitions. Target speaking practice remains in English.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={explanationLanguage === 'te_en'}
                onChange={(e) => setExplanationLanguage(e.target.checked ? 'te_en' : 'en')}
                className="sr-only peer"
                aria-label="Toggle Telugu explanations"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sv-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Audio & Recording Preferences */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-sv-accent" />
            <CardTitle className="text-lg font-bold">2. Audio & Recording Management</CardTitle>
          </div>
          <CardDescription>
            Control how long session audio is preserved and adjust listening playback speed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Retention */}
          <div>
            <label className="block text-sm font-medium text-sv-text mb-2">
              Recording Retention Policy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRecordingRetention('session')}
                className={`p-3 rounded-lg border text-left min-h-[44px] ${
                  recordingRetention === 'session'
                    ? 'border-sv-primary bg-blue-50 text-sv-text font-medium ring-2 ring-sv-primary/20'
                    : 'border-sv-border bg-white text-sv-text hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-sm">Session Only (Ephemeral)</div>
                <p className="text-xs text-sv-text-secondary mt-1">
                  Audio is processed for real-time transcription and deleted immediately when the session ends.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRecordingRetention('30_days')}
                className={`p-3 rounded-lg border text-left min-h-[44px] ${
                  recordingRetention === '30_days'
                    ? 'border-sv-primary bg-blue-50 text-sv-text font-medium ring-2 ring-sv-primary/20'
                    : 'border-sv-border bg-white text-sv-text hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-sm">Retain for 30 Days</div>
                <p className="text-xs text-sv-text-secondary mt-1">
                  Store recordings in your private vault for 30 days so you can re-listen and review your pronunciation.
                </p>
              </button>
            </div>
          </div>

          {/* Audio Speed */}
          <div>
            <label className="block text-sm font-medium text-sv-text mb-2">
              Default Listening Playback Speed ({audioSpeed}x)
            </label>
            <div className="flex items-center gap-3">
              {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setAudioSpeed(speed)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium min-h-[36px] ${
                    audioSpeed === speed
                      ? 'border-sv-primary bg-sv-primary text-white font-semibold'
                      : 'border-sv-border bg-white text-sv-text hover:bg-gray-50'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Practice Reminders */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-sv-warning" />
            <CardTitle className="text-lg font-bold">3. Practice Reminders & Daily Goal</CardTitle>
          </div>
          <CardDescription>
            Consistency drives fluency. Configure notifications and daily practice targets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-sv-border">
            <div>
              <span className="font-semibold text-sm text-sv-text block">
                Daily Practice Notifications
              </span>
              <p className="text-xs text-sv-text-secondary mt-0.5">
                Receive browser and email nudges to complete your spaced repetition tasks.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle daily notifications"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sv-primary"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Daily Reminder Time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={!notifications}
            />
            <Input
              label="Daily Target (Minutes)"
              type="number"
              min={5}
              max={60}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Accessibility Preferences */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-sv-primary" />
            <CardTitle className="text-lg font-bold">4. Accessibility (WCAG 2.2 AA)</CardTitle>
          </div>
          <CardDescription>
            Personalize display contrast, motion transitions, and typography scale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reduce Motion */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-sv-border">
            <div>
              <span className="font-semibold text-sm text-sv-text block">
                Reduce Motion
              </span>
              <p className="text-xs text-sv-text-secondary mt-0.5">
                Minimizes UI animations and dynamic slide transitions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle reduce motion"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sv-primary"></div>
            </label>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-sv-border">
            <div>
              <span className="font-semibold text-sm text-sv-text block">
                High Contrast Mode
              </span>
              <p className="text-xs text-sv-text-secondary mt-0.5">
                Increases border visibility and contrast ratio for text elements.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle high contrast"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sv-primary"></div>
            </label>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-sv-text mb-2">
              Font Scale
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium min-h-[40px] ${
                    fontSize === sz
                      ? 'border-sv-primary bg-sv-primary text-white font-semibold'
                      : 'border-sv-border bg-white text-sv-text hover:bg-gray-50'
                  }`}
                >
                  {sz === 'sm' ? 'Standard (Small)' : sz === 'md' ? 'Default (Medium)' : 'Large (Accessibility)'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Privacy & Data Rights */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sv-primary" />
            <CardTitle className="text-lg font-bold">5. Privacy, Consents & Data Governance</CardTitle>
          </div>
          <CardDescription>
            You control your data. Manage microphone access permissions, export your learning logs, or delete your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consent History */}
          <div>
            <span className="text-xs font-semibold text-sv-text uppercase tracking-wide block mb-2">
              Consent History
            </span>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-sv-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-sv-text">Microphone Audio Recording</div>
                  <div className="text-sv-text-secondary text-[11px]">Used exclusively for speech recognition during active sessions.</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleWithdrawConsent('microphone')}
                  className="text-xs text-sv-error hover:bg-red-50"
                >
                  Withdraw
                </Button>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-sv-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-sv-text">AI Diagnostic Evaluation</div>
                  <div className="text-sv-text-secondary text-[11px]">Processes typed text and transcripts to compute formative recommendations.</div>
                </div>
                <Badge variant="success">Active (Essential)</Badge>
              </div>

              {consents.length > 0 && (
                <div className="pt-1 space-y-1 border-t border-sv-border/60">
                  <span className="text-[10px] text-sv-text-secondary uppercase tracking-wide block">Logged Consent Events ({consents.length})</span>
                  {consents.map((c) => (
                    <div key={c.id} className="text-[11px] text-sv-text-secondary flex justify-between">
                      <span className="font-mono">{c.purpose}</span>
                      <span className={c.granted ? 'text-sv-success' : 'text-sv-error'}>
                        {c.granted ? 'Granted' : 'Withdrawn'} on {new Date(c.grantedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export & Delete Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              loading={exporting}
              onClick={handleExportData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Request Full Data Export (JSON)
            </Button>

            <Button
              variant="danger"
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account & Clear Data
            </Button>
          </div>

          {deleteConfirmOpen && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sv-error font-bold text-sm">
                <AlertTriangle className="h-5 w-5" />
                Permanent Account Deletion Warning
              </div>
              <p className="text-xs text-sv-text-secondary leading-relaxed">
                This action is irreversible. All your lesson progress, audio transcripts, mock interview reports, and earned certificates will be permanently deleted in accordance with data protection guidelines.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" onClick={handleDeleteAccount}>
                  Yes, Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. AI Feedback Disclaimer (Static text from spec) */}
      <Card className="border-sv-primary/30 bg-blue-50/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-sv-primary" />
            <CardTitle className="text-base font-bold text-sv-text">
              6. AI Feedback Disclaimer & Ethical Statement
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-sv-text-secondary space-y-2 leading-relaxed">
          <p>
            • <strong>Formative Feedback Only:</strong> All scores, grammar observations, and rubrics generated across LUMIXORA SpeakVerse are automated formative learning signals. They do not constitute an accredited English proficiency certificate, CEFR formal verification, or employment guarantee.
          </p>
          <p>
            • <strong>Equal Evaluation via Typed Fallback:</strong> Every voice activity within SpeakVerse is fully accessible using typed text. Submissions made via typed input receive equivalent rubric evaluation, scoring rigor, and personalized feedback.
          </p>
          <p>
            • <strong>Speech Recognition Nuance:</strong> Automated acoustic evaluations can be affected by ambient background noise, hardware microphone quality, and connectivity. Transcripts and metrics should be reviewed as diagnostic guidance.
          </p>
        </CardContent>
      </Card>

      {/* Save Button Bar */}
      <div className="sticky bottom-4 bg-sv-surface border border-sv-border rounded-sv p-4 shadow-xl flex items-center justify-between gap-4">
        <span className="text-xs text-sv-text-secondary">
          Remember to save any modifications made to your preferences.
        </span>
        <Button onClick={handleSave} loading={saving} size="lg" className="font-semibold">
          Save All Preferences
        </Button>
      </div>
    </div>
  )
}
