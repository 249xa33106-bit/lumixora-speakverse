'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Mic, BookOpen, Headphones, GraduationCap, Flame, ArrowRight,
  Sparkles, CheckCircle2, RotateCcw, Brain, PenTool, Calendar, AlertTriangle, Boxes
} from 'lucide-react'

interface DashboardData {
  profile: {
    displayName?: string
    college?: string
    targetRole?: string
    learningGoal?: string
    dailyGoalMinutes: number
    selfAssessedLevel?: string
    targetDate?: string
  } | null
  skillSummaries: Array<{
    skill: string
    recentAvgScore: number
    attemptCount: number
    lastAttemptAt: string | null
  }>
  recommendations: Array<{
    type: string
    entityId: string
    title: string
    reason: string
    priority: number
    skill: string
    estimatedMinutes?: number
  }>
  recentProgress: Array<{
    id: string
    status: string
    completedAt: string | null
    lastAccessedAt: string
    lesson: {
      title: string
      skill: string
      estimatedMinutes: number
    }
  }>
  dueRevisions: number
}

const skillMeta: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  grammar: { label: 'Grammar', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50' },
  vocabulary: { label: 'Vocabulary', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
  speaking: { label: 'Speaking', icon: Mic, color: 'text-amber-600', bg: 'bg-amber-50' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  writing: { label: 'Writing', icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50' },
  interview: { label: 'Interview Prep', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

export default function DashboardHome() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/speakverse/v1/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard data')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-gray-200 rounded-sv" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-40 bg-gray-200 rounded-sv" />
          <div className="h-40 bg-gray-200 rounded-sv" />
          <div className="h-40 bg-gray-200 rounded-sv" />
        </div>
      </div>
    )
  }

  const profile = data?.profile
  const skillSummaries = data?.skillSummaries || []
  const recommendations = data?.recommendations || []
  const recentProgress = data?.recentProgress || []
  const dueRevisions = data?.dueRevisions || 0

  const primaryRecommendation = recommendations[0]

  return (
    <div className="space-y-8">
      {/* Welcome & Mission Banner */}
      <div className="bg-gradient-to-r from-sv-primary to-blue-700 rounded-sv-lg p-6 text-white shadow-sv-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                Daily Goal: {profile?.dailyGoalMinutes || 10} Mins
              </span>
              <div className="flex items-center gap-1 text-xs text-blue-100 font-medium">
                <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
                <span>3-Day Streak!</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.displayName || 'Student'}!
            </h1>
            <p className="text-sm text-blue-100">
              {profile?.targetRole
                ? `Preparing for your ${profile.targetRole} placement journey. Keep the momentum going!`
                : 'Consistency is key to natural spoken English. Complete today\'s recommended practice.'}
            </p>
          </div>

          <div className="flex-shrink-0">
            {primaryRecommendation ? (
              <Link
                href={`/speakverse/lesson/${primaryRecommendation.entityId}`}
                className="inline-flex items-center gap-2 bg-white text-sv-primary px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                Start Today&apos;s Mission <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/speakverse/learn"
                className="inline-flex items-center gap-2 bg-white text-sv-primary px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                Go to Curriculum <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Due Revisions Alert */}
      {dueRevisions > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-sv flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-sv-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-sv-text">
                {dueRevisions} revision item{dueRevisions > 1 ? 's' : ''} ready for review!
              </p>
              <p className="text-xs text-sv-text-secondary">
                Spaced repetition strengthens memory retention before your interviews.
              </p>
            </div>
          </div>
          <Link
            href="/speakverse/learn"
            className="text-xs font-semibold text-sv-warning hover:underline"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Recommended Next Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-sv-text">Recommended For You</h2>
            <p className="text-xs text-sv-text-secondary">
              Personalized suggestions based on your target role and recent scores
            </p>
          </div>
          <Link href="/speakverse/learn" className="text-xs font-semibold text-sv-primary hover:underline">
            View full path →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, 2).map((rec, idx) => {
            const meta = skillMeta[rec.skill] || skillMeta.grammar
            const Icon = meta.icon
            return (
              <Card key={idx} hover padding="md" className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-sv-text-secondary">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="capitalize">{rec.skill}</span>
                    </span>
                    <span className="text-xs text-sv-text-secondary">
                      {rec.estimatedMinutes || 5} mins
                    </span>
                  </div>
                  <h3 className="font-semibold text-sv-text text-base mb-1">{rec.title}</h3>
                  <p className="text-xs text-sv-text-secondary leading-relaxed">{rec.reason}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-sv-border flex justify-end">
                  <Link
                    href={`/speakverse/lesson/${rec.entityId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sv-primary hover:text-sv-primary-hover"
                  >
                    Start Activity <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 6 Skill Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-sv-text">Skill Proficiency Overview</h2>
            <p className="text-xs text-sv-text-secondary">
              Real-time formative indicators across key communication competencies
            </p>
          </div>
          <Link href="/speakverse/progress" className="text-xs font-semibold text-sv-primary hover:underline">
            Detailed Analytics →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['grammar', 'vocabulary', 'speaking', 'listening', 'writing', 'interview'].map(skillKey => {
            const summary = skillSummaries.find(s => s.skill === skillKey)
            const meta = skillMeta[skillKey]
            const Icon = meta.icon
            const scorePct = summary?.attemptCount ? Math.round(summary.recentAvgScore * 100) : 70

            return (
              <Card key={skillKey} padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${meta.bg} ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-sv-text">
                    {scorePct}%
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-sv-text">{meta.label}</h3>
                  <div className="mt-2">
                    <Progress value={scorePct} size="sm" color="primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-sv-text-secondary pt-1">
                  <span>{summary?.attemptCount ? `${summary.attemptCount} activities` : 'Ready to start'}</span>
                  <Link
                    href={`/speakverse/learn`}
                    className="font-medium text-sv-primary hover:underline"
                  >
                    Practice
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Launch Arenas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/speakverse/speak"
          className="p-5 bg-sv-surface border border-sv-border rounded-sv shadow-sv-card hover:shadow-sv-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sv-text group-hover:text-sv-primary transition-colors">
              Speak Studio
            </h4>
            <p className="text-xs text-sv-text-secondary">Fluency & pronunciation coaching</p>
          </div>
        </Link>

        <Link
          href="/speakverse/listening"
          className="p-5 bg-sv-surface border border-sv-border rounded-sv shadow-sv-card hover:shadow-sv-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sv-text group-hover:text-sv-primary transition-colors">
              Listening Lab
            </h4>
            <p className="text-xs text-sv-text-secondary">Accents, dictation & comprehension</p>
          </div>
        </Link>

        <Link
          href="/speakverse/interview"
          className="p-5 bg-sv-surface border border-sv-border rounded-sv shadow-sv-card hover:shadow-sv-card-hover transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-sv-text group-hover:text-sv-primary transition-colors">
              Interview Arena
            </h4>
            <p className="text-xs text-sv-text-secondary">Mock HR & Technical simulations</p>
          </div>
        </Link>
      </div>

      {/* 3D Classroom Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-sv-primary to-blue-800 rounded-sv-lg p-6 text-white shadow-sv-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Boxes className="h-8 w-8 text-amber-300" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900 uppercase tracking-wider">
                3D Experience
              </span>
              <span className="text-xs text-blue-200">Interactive Spatial Learning</span>
            </div>
            <h3 className="text-xl font-bold mt-1">Immersive 3D English Classroom</h3>
            <p className="text-xs text-blue-100 max-w-lg mt-0.5">
              Enter our interactive 3D learning environment to practice spatial vocabulary, interactive objects, and realistic placement interview stages.
            </p>
          </div>
        </div>
        <Link
          href="/speakverse/classroom"
          className="inline-flex items-center gap-2 bg-white text-sv-primary px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-md flex-shrink-0"
        >
          Enter 3D Classroom <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Notice on Formative AI feedback */}
      <div className="text-center text-xs text-sv-text-secondary pt-4 border-t border-sv-border">
        AI evaluation metrics are provided as formative learning feedback to support your personal growth.
      </div>
    </div>
  )
}
