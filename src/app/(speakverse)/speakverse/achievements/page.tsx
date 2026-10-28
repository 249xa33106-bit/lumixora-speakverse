'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Trophy,
  Award,
  BookOpen,
  Flame,
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Download,
  Calendar,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface Milestone {
  id: string
  title: string
  description: string
  unlocked: boolean
  progress: number
  max: number
  category: string
  unlockedAt: string | null
}

interface Certificate {
  id: string
  courseTitle: string
  issuedDate: string
  assessedSkills: string[]
  level: string
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  BookOpen,
  Flame,
  GraduationCap,
  Sparkles,
  Zap,
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState({ completedLessons: 0, completedInterviews: 0, attemptCount: 0 })

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch('/api/speakverse/v1/achievements')
        if (!res.ok) throw new Error('Failed to load achievements')
        const data = await res.json()
        setMilestones(data.milestones || [])
        setCertificates(data.certificates || [])
        setStats(data.stats || { completedLessons: 0, completedInterviews: 0, attemptCount: 0 })
      } catch (err) {
        console.error('Error fetching achievements:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [])

  const handleDownloadCert = (title: string) => {
    toast.success(`Certificate for "${title}" download initiated (PDF).`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 text-sv-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-sv-text-secondary">Loading your milestones and certificates...</p>
      </div>
    )
  }

  const unlockedCount = milestones.filter((m) => m.unlocked).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-amber-100 text-sv-warning">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-sv-warning">
            Recognition & Credentials
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Achievements & Certificates</h1>
        <p className="text-sv-text-secondary mt-1">
          Celebrate your consistency, track unlocked milestones, and view completion credentials.
        </p>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-sv-primary text-white p-6 rounded-sv shadow-sv-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-bold">Milestones Unlocked: {unlockedCount} of {milestones.length}</h2>
          <p className="text-sm text-blue-100">
            Keep completing lessons, mock interviews, and daily practice to unlock all badges!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/15 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold">{stats.completedLessons}</div>
            <div className="text-xs text-blue-200">Lessons Finished</div>
          </div>
          <div className="bg-white/15 px-4 py-2.5 rounded-xl text-center">
            <div className="text-xl font-extrabold">{stats.completedInterviews}</div>
            <div className="text-xs text-blue-200">Interviews Held</div>
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <section className="space-y-4" aria-label="Earned milestones">
        <h2 className="text-xl font-bold text-sv-text flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sv-primary" aria-hidden="true" />
          Earned Milestones
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((milestone) => {
            const Icon = ICON_MAP[milestone.id === 'streak-7' ? 'Flame' : milestone.id === 'first-interview' ? 'GraduationCap' : milestone.id === 'grammar-master' ? 'Sparkles' : 'BookOpen'] || Trophy
            return (
              <Card
                key={milestone.id}
                className={`border transition-all ${
                  milestone.unlocked
                    ? 'border-green-200 bg-white shadow-sv-card'
                    : 'border-sv-border bg-gray-50/70 opacity-80'
                }`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`p-3 rounded-xl ${
                        milestone.unlocked
                          ? 'bg-green-100 text-sv-success'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    {milestone.unlocked ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 text-gray-500">
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-sv-text">{milestone.title}</h3>
                    <p className="text-xs text-sv-text-secondary mt-1 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>

                  {!milestone.unlocked && (
                    <div className="pt-1">
                      <Progress
                        value={(milestone.progress / milestone.max) * 100}
                        size="sm"
                        label={`Progress: ${milestone.progress} / ${milestone.max}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Course Completion Certificates Section */}
      <section className="space-y-4 pt-4 border-t border-sv-border" aria-label="Course completion certificates">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-sv-text flex items-center gap-2">
              <Award className="h-5 w-5 text-sv-primary" aria-hidden="true" />
              Course Completion Certificates
            </h2>
            <p className="text-xs text-sv-text-secondary mt-0.5">
              Certificates awarded upon finishing structured learning tracks.
            </p>
          </div>
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="border-sv-primary/30 shadow-sv-card bg-gradient-to-br from-white to-blue-50/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="info">Level {cert.level}</Badge>
                    <div className="flex items-center gap-1 text-xs text-sv-text-secondary">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      Issued: {cert.issuedDate}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-sv-text mt-2">
                    {cert.courseTitle}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div>
                    <span className="text-xs font-semibold text-sv-text uppercase tracking-wider">
                      Skills Assessed in Curriculum:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {cert.assessedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-sv-text-secondary text-[11px]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mandatory Spec Label */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-sv-warning font-medium">
                    This certificate reflects completion of {cert.courseTitle}. It is not a verified proficiency credential.
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    onClick={() => handleDownloadCert(cert.courseTitle)}
                  >
                    <Download className="h-4 w-4 mr-1.5 text-sv-primary" aria-hidden="true" />
                    Download Certificate
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-sv-border p-8 text-center">
            <GraduationCap className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-sv-text">No Course Certificates Yet</h3>
            <p className="text-xs text-sv-text-secondary max-w-sm mx-auto mt-1">
              Complete your first English module or full mock interview to earn your verified course completion certificate.
            </p>
            <div className="mt-4">
              <Link href="/speakverse/learn">
                <Button size="sm">
                  Start Curriculum Lessons
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
