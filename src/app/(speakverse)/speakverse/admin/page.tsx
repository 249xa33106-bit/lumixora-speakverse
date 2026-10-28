import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldAlert,
  Users,
  BookOpen,
  ClipboardCheck,
  AlertCircle,
  Edit3,
  HelpCircle,
  BarChart2,
  DollarSign,
  History,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

const AUTHORIZED_ROLES = [
  'admin',
  'administrator',
  'content_editor',
  'content_reviewer',
  'assessment_manager',
  'support_agent',
]

export default async function AdminDashboardPage() {
  const session = await auth()
  const userRole = (session?.user as { role?: string })?.role || 'student'

  // Server-side authorization check (Rule: Return 403 message, do not just hide link)
  if (!session?.user || !AUTHORIZED_ROLES.includes(userRole)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-red-200 rounded-sv shadow-sv-card text-center space-y-4">
        <div className="p-3 bg-red-100 text-sv-error rounded-full inline-flex">
          <ShieldAlert className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-sv-text">403 — Unauthorized Access</h1>
        <p className="text-sm text-sv-text-secondary leading-relaxed">
          You do not have administrative or editorial permissions to view the SpeakVerse Admin Console.
          Your current account role is <Badge variant="outline" className="font-mono">{userRole}</Badge>.
        </p>
        <div className="pt-2">
          <Link href="/speakverse/home">
            <Button variant="secondary">Return to Student Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Aggregate Admin Dashboard Metrics
  const [totalStudents, publishedLessons, pendingReviews, reportedIssues] = await Promise.all([
    prisma.user.count({
      where: { role: 'student' },
    }),
    prisma.svLesson.count({
      where: { status: 'published' },
    }),
    prisma.svLesson.count({
      where: { status: { in: ['draft', 'review'] } },
    }),
    prisma.svFeedbackReport.count({
      where: { status: 'open' },
    }),
  ])

  const ADMIN_SECTIONS = [
    {
      title: 'Content Library & Lifecycle',
      description: 'Manage, review, publish, and retire curriculum modules and lessons.',
      href: '/speakverse/admin/content',
      icon: BookOpen,
      badge: `${publishedLessons} Published`,
      badgeVariant: 'success' as const,
    },
    {
      title: 'Course Editor',
      description: 'Design learning paths, syllabus stages, prerequisite rules, and module positions.',
      href: '/speakverse/admin/courses',
      icon: Edit3,
      badge: 'Curriculum',
      badgeVariant: 'info' as const,
    },
    {
      title: 'Question Bank',
      description: 'Review interview prompts, technical scenarios, and conversational starters.',
      href: '/speakverse/admin/question-bank',
      icon: HelpCircle,
      badge: 'Arena Bank',
      badgeVariant: 'default' as const,
    },
    {
      title: 'Cohort Analytics',
      description: 'View student completion rates, average scores, and engagement trends by college.',
      href: '/speakverse/admin/analytics',
      icon: BarChart2,
      badge: 'Reports',
      badgeVariant: 'info' as const,
    },
    {
      title: 'AI Usage & Costs',
      description: 'Monitor token consumption, latency, error rates, and estimated Gemini spend.',
      href: '/speakverse/admin/usage',
      icon: DollarSign,
      badge: 'Budget Tracker',
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Audit Log',
      description: 'Trace content changes, publication events, role grants, and administrative actions.',
      href: '/speakverse/admin/audit',
      icon: History,
      badge: 'Security',
      badgeVariant: 'default' as const,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-sv-primary">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">SpeakVerse Admin Console</h1>
          <p className="text-sv-text-secondary mt-1">
            Curriculum authoring, pedagogical review, learner operations, and AI system monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs font-mono py-1 px-2.5">
            Role: {userRole}
          </Badge>
        </div>
      </div>

      {/* Dashboard KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-sv-primary">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">{totalStudents}</div>
              <p className="text-xs text-sv-text-secondary">Enrolled Students</p>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Published */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-sv-success">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">{publishedLessons}</div>
              <p className="text-xs text-sv-text-secondary">Lessons Published</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-sv-warning">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">{pendingReviews}</div>
              <p className="text-xs text-sv-text-secondary">Pending Reviews</p>
            </div>
          </CardContent>
        </Card>

        {/* Reported Issues */}
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 text-sv-error">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">{reportedIssues}</div>
              <p className="text-xs text-sv-text-secondary">Reported Issues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules Navigation Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-sv-text">Management Tools & Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_SECTIONS.map((sec) => {
            const Icon = sec.icon
            return (
              <Card key={sec.title} hover className="flex flex-col justify-between border-sv-border">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-sv-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <Badge variant={sec.badgeVariant}>{sec.badge}</Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-sv-text">
                      {sec.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs leading-relaxed">
                      {sec.description}
                    </CardDescription>
                  </CardContent>
                </div>

                <CardFooter className="pt-2">
                  <Link href={sec.href} className="w-full">
                    <Button variant="secondary" size="sm" fullWidth className="group text-xs">
                      Access Tool
                      <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
