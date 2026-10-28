'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen, CheckCircle, Clock, Lock, ArrowRight,
  Brain, Mic, Headphones, GraduationCap, Sparkles, Filter
} from 'lucide-react'

interface Lesson {
  id: string
  slug: string
  title: string
  objective: string
  difficulty: string
  estimatedMinutes: number
  skill: string
  stage: string
  _count: { activities: number }
}

interface Module {
  id: string
  title: string
  description: string | null
  position: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string | null
  targetLevel: string | null
  modules: Module[]
}

interface CurriculumResponse {
  courses: Course[]
  progressMap: Record<string, string>
}

const stages = [
  { id: 'foundation', name: 'Stage 1: Foundation', level: 'A1–A2', desc: 'Core grammar, basic sentence structure & placement basics' },
  { id: 'everyday', name: 'Stage 2: Everyday Fluency', level: 'A2–B1', desc: 'Social conversations, opinions, active listening & daily campus English' },
  { id: 'fluency', name: 'Stage 3: Fluency & Confidence', level: 'B1', desc: 'Spoken rhythm, hesitation reduction & impromptu speaking' },
  { id: 'professional', name: 'Stage 4: Professional & Workplace', level: 'B1–B2', desc: 'Formal emails, meeting participation & presentation delivery' },
  { id: 'interview_excellence', name: 'Stage 5: Placement & Interview Mastery', level: 'B2–C1', desc: 'HR questions, STAR method, technical interviews & group discussions' },
]

export default function LearnPage() {
  const [selectedSkill, setSelectedSkill] = useState<string>('all')

  const { data, isLoading } = useQuery<CurriculumResponse>({
    queryKey: ['curriculum'],
    queryFn: async () => {
      const res = await fetch('/api/speakverse/v1/curriculum')
      if (!res.ok) throw new Error('Failed to fetch curriculum')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-sv" />
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded-sv" />
          <div className="h-32 bg-gray-200 rounded-sv" />
        </div>
      </div>
    )
  }

  const courses = data?.courses || []
  const progressMap = data?.progressMap || {}

  // Gather all lessons across all modules
  const allLessons: Lesson[] = []
  courses.forEach(c => {
    c.modules.forEach(m => {
      allLessons.push(...m.lessons)
    })
  })

  const filteredLessons = allLessons.filter(l =>
    selectedSkill === 'all' ? true : l.skill === selectedSkill
  )

  const completedCount = allLessons.filter(l => progressMap[l.id] === 'completed').length
  const totalCount = allLessons.length || 1
  const overallPct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Path Header */}
      <div className="bg-sv-surface border border-sv-border rounded-sv-lg p-6 shadow-sv-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sv-primary">
              Structured Placement Curriculum
            </span>
            <h1 className="text-2xl font-bold text-sv-text mt-1">
              Your English Communication Skill Tree
            </h1>
            <p className="text-sm text-sv-text-secondary mt-1">
              Master step-by-step from foundational sentences to high-stakes placement interviews.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-extrabold text-sv-primary">{overallPct}%</span>
            <span className="text-xs text-sv-text-secondary block">Path Completed</span>
          </div>
        </div>
        <Progress value={overallPct} size="md" color="primary" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2" role="group" aria-label="Skill filters">
        <span className="text-xs font-semibold text-sv-text-secondary flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: 'All Skills' },
          { id: 'grammar', label: 'Grammar' },
          { id: 'vocabulary', label: 'Vocabulary' },
          { id: 'speaking', label: 'Speaking' },
          { id: 'listening', label: 'Listening' },
          { id: 'interview', label: 'Interview' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedSkill(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              selectedSkill === filter.id
                ? 'bg-sv-primary text-white'
                : 'bg-white border border-sv-border text-sv-text-secondary hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 5 Stages Skill Tree Path */}
      <div className="space-y-12">
        {stages.map((stage, sIdx) => {
          const stageLessons = filteredLessons.filter(l => l.stage === stage.id)

          return (
            <div key={stage.id} className="relative">
              {/* Connector line to next stage */}
              {sIdx < stages.length - 1 && (
                <div
                  className="absolute left-6 top-16 bottom-0 w-0.5 bg-sv-border -z-0 hidden md:block"
                  style={{ height: 'calc(100% + 48px)' }}
                  aria-hidden="true"
                />
              )}

              {/* Stage header node */}
              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="h-12 w-12 rounded-full bg-sv-primary text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                  {sIdx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-sv-text">{stage.name}</h2>
                    <Badge variant="outline">{stage.level}</Badge>
                  </div>
                  <p className="text-xs text-sv-text-secondary mt-0.5">{stage.desc}</p>
                </div>
              </div>

              {/* Lesson cards in this stage */}
              <div className="md:ml-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                {stageLessons.length === 0 ? (
                  <div className="col-span-2 p-6 bg-sv-surface/60 border border-dashed border-sv-border rounded-sv text-center text-xs text-sv-text-secondary">
                    No lessons matching this filter in {stage.name} yet.
                  </div>
                ) : (
                  stageLessons.map(lesson => {
                    const status = progressMap[lesson.id] || 'not_started'
                    const isCompleted = status === 'completed'
                    const isInProgress = status === 'in_progress'

                    return (
                      <Card
                        key={lesson.id}
                        hover
                        padding="md"
                        className="flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-sv-primary capitalize">
                              {lesson.skill}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-sv-text-secondary">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.estimatedMinutes} min</span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-sv-text text-sm mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-sv-text-secondary line-clamp-2">
                            {lesson.objective}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-sv-border flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs">
                            {isCompleted ? (
                              <span className="text-sv-success font-medium flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Completed
                              </span>
                            ) : isInProgress ? (
                              <span className="text-sv-primary font-medium">In Progress</span>
                            ) : (
                              <span className="text-sv-text-secondary">Ready to start</span>
                            )}
                          </div>
                          <Link
                            href={`/speakverse/lesson/${lesson.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sv-primary text-white text-xs font-semibold hover:bg-sv-primary-hover transition-colors"
                          >
                            {isCompleted ? 'Review' : 'Start'} <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
