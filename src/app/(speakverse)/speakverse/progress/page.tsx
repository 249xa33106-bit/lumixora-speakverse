'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
  BookOpen,
  GraduationCap,
} from 'lucide-react'

interface SkillItem {
  initial: number
  recent: number
  count: number
}

interface ProgressData {
  skills: Record<string, SkillItem>
  weeklyFrequency: Array<{ week: string; label: string; count: number }>
  completedObjectivesCount: number
  recurringMistakes: Record<string, Array<{ id: string; text: string; dueAt: string; status: string }>>
  upcomingRevisions: Array<{ id: string; skill: string; dueAt: string; status: string; content?: { concept?: string; note?: string } }>
  interviewReadiness: {
    percentage: number
    stage: string
    interviewEvidenceCount: number
    disclaimer: string
  }
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProgressData | null>(null)

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/speakverse/v1/progress/overview')
        if (!res.ok) throw new Error('Failed to fetch progress')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 text-sv-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-sv-text-secondary">Loading your skill progress and analytics...</p>
      </div>
    )
  }

  const skillsList = [
    { key: 'grammar', name: 'Grammar & Accuracy', desc: 'Tenses, sentence formation, and agreement' },
    { key: 'vocabulary', name: 'Vocabulary & Lexis', desc: 'Academic, professional, and descriptive terms' },
    { key: 'speaking', name: 'Spoken Fluency', desc: 'Connected speech, clarity, and pacing' },
    { key: 'listening', name: 'Listening Lab', desc: 'Comprehension, key details, and instruction' },
    { key: 'writing', name: 'Written Expression', desc: 'Clarity, conciseness, and email etiquette' },
    { key: 'interview', name: 'Interview Readiness', desc: 'STAR structure, persuasion, and role dialogue' },
  ]

  const maxWeeklyCount = Math.max(1, ...(data?.weeklyFrequency.map((w) => w.count) || [1]))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-sv-primary">
              Formative Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">My Learning Progress</h1>
          <p className="text-sv-text-secondary mt-1">
            Track your foundational improvements, review recurring patterns, and prepare for placement interviews.
          </p>
        </div>

        <Link href="/speakverse/achievements">
          <Button variant="secondary" className="self-start sm:self-auto">
            <Award className="h-4 w-4 mr-2 text-sv-primary" aria-hidden="true" />
            View Achievements
          </Button>
        </Link>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Objectives */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-sv-primary">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">
                {data?.completedObjectivesCount ?? 0}
              </div>
              <p className="text-xs text-sv-text-secondary">Completed Objectives</p>
            </div>
          </CardContent>
        </Card>

        {/* Practice Sessions */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 text-sv-accent">
              <TrendingUp className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">
                {data?.weeklyFrequency.reduce((a, b) => a + b.count, 0) ?? 0}
              </div>
              <p className="text-xs text-sv-text-secondary">Activities (Past 4 Weeks)</p>
            </div>
          </CardContent>
        </Card>

        {/* Readiness */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-sv-warning">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">
                {data?.interviewReadiness?.percentage ?? 50}%
              </div>
              <p className="text-xs text-sv-text-secondary">
                {data?.interviewReadiness?.stage ?? 'Developing'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Skill Comparison (Simple CSS Bars) */}
      <Card className="border-sv-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold">Skill Growth: Initial vs Recent Score</CardTitle>
              <CardDescription>
                Compare your baseline diagnostics against recent practice evidence across all 6 core skills.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-300 inline-block" />
                <span className="text-sv-text-secondary">Initial Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sv-primary inline-block" />
                <span className="text-sv-primary font-semibold">Recent Score</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-sv-text-secondary mt-1 italic">
            Scores reflect AI-assessed attempts and are formative learning signals.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {skillsList.map((skill) => {
            const initial = data?.skills[skill.key]?.initial ?? 50
            const recent = data?.skills[skill.key]?.recent ?? 60
            const count = data?.skills[skill.key]?.count ?? 0

            return (
              <div key={skill.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-sv-text">{skill.name}</span>
                    <span className="text-xs text-sv-text-secondary ml-2">({skill.desc})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-sv-text-secondary">{initial}% Initial</span>
                    <span className="text-sv-border font-light">|</span>
                    <span className="text-sv-primary font-bold">{recent}% Recent</span>
                  </div>
                </div>

                {/* Side-by-side CSS bars */}
                <div className="space-y-1.5">
                  {/* Initial Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gray-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${initial}%` }}
                      title={`Initial: ${initial}%`}
                    />
                  </div>
                  {/* Recent Bar */}
                  <div className="w-full bg-blue-50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-sv-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${recent}%` }}
                      title={`Recent: ${recent}%`}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-sv-text-secondary flex justify-between">
                  <span>{count} evidence items recorded</span>
                  {recent > initial && (
                    <span className="text-sv-success font-semibold flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +{recent - initial}% growth
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Practice Frequency: Last 4 Weeks */}
      <Card className="border-sv-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sv-primary" aria-hidden="true" />
            Practice Frequency (Last 4 Weeks)
          </CardTitle>
          <CardDescription>
            Consistent, spaced practice is more effective than cramming. Keep your weekly momentum active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {data?.weeklyFrequency.map((wf) => {
              const heightPct = Math.round((wf.count / maxWeeklyCount) * 100)
              return (
                <div key={wf.week} className="flex flex-col items-center justify-end h-36 space-y-2">
                  <span className="text-xs font-bold text-sv-primary">{wf.count} sessions</span>
                  <div className="w-full max-w-[60px] bg-blue-50 rounded-t-lg h-24 flex items-end justify-center p-1">
                    <div
                      className="w-full bg-sv-primary rounded-t-md transition-all duration-500 min-h-[6px]"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-sv-text">{wf.week}</div>
                    <div className="text-[10px] text-sv-text-secondary">{wf.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interview Readiness Profile */}
      <Card className="border-sv-border bg-gradient-to-br from-white to-blue-50/40">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-lg font-bold">Interview Readiness Profile</CardTitle>
          </div>
          <CardDescription>
            Weighted composite readiness index calculated from your mock interview attempts, technical explanations, and behavioral rounds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-sv-border">
            <div>
              <div className="text-xs text-sv-text-secondary uppercase tracking-wider font-semibold">
                Current Readiness Level
              </div>
              <div className="text-3xl font-extrabold text-sv-primary mt-1">
                {data?.interviewReadiness?.percentage ?? 50}%
              </div>
              <div className="text-sm font-medium text-sv-text mt-0.5">
                Status: <span className="text-sv-accent font-semibold">{data?.interviewReadiness?.stage}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <Link href="/speakverse/interview">
                <Button>
                  Practice in Interview Arena
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-xs text-sv-text-secondary bg-blue-50 p-3 rounded-lg border border-blue-200">
            <strong>Formative Disclaimer:</strong> {data?.interviewReadiness?.disclaimer}
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Grid: Recurring Mistakes & Revision Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recurring Mistakes List */}
        <Card className="border-sv-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-sv-warning" aria-hidden="true" />
              Recurring Error Patterns
            </CardTitle>
            <CardDescription className="text-xs">
              Frequent mistakes identified across exercises, organized by skill domain for targeted revision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {data?.recurringMistakes && Object.keys(data.recurringMistakes).length > 0 ? (
              Object.entries(data.recurringMistakes).map(([skill, items]) => (
                <div key={skill} className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase text-sv-primary tracking-wide">
                    {skill}
                  </div>
                  <ul className="space-y-1">
                    {items.slice(0, 3).map((item) => (
                      <li key={item.id} className="text-xs text-sv-text bg-gray-50 p-2 rounded border border-sv-border/80 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sv-warning mt-1.5 flex-shrink-0" />
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-sv-text-secondary">
                <CheckCircle className="h-8 w-8 text-sv-success mx-auto mb-2" />
                No recurring mistake patterns logged yet. Keep practicing!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revision Schedule: Spaced Repetition Due Items */}
        <Card className="border-sv-border">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-sv-primary" aria-hidden="true" />
              Upcoming Revision Schedule
            </CardTitle>
            <CardDescription className="text-xs">
              Algorithmic spaced repetition items due for review to cement long-term memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data?.upcomingRevisions && data.upcomingRevisions.length > 0 ? (
              data.upcomingRevisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-lg border border-sv-border bg-sv-surface flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {rev.skill}
                      </Badge>
                      <span className="font-medium text-sv-text truncate max-w-[200px]">
                        {rev.content?.concept || rev.content?.note || 'Targeted Practice'}
                      </span>
                    </div>
                    <p className="text-[11px] text-sv-text-secondary">
                      Due: {new Date(rev.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Link href="/speakverse/learn">
                    <Button size="sm" variant="secondary" className="text-xs py-1 px-2.5 min-h-[32px]">
                      Review
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-sv-text-secondary">
                <Sparkles className="h-8 w-8 text-sv-primary mx-auto mb-2" />
                All revision items are up to date! Check back tomorrow.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
