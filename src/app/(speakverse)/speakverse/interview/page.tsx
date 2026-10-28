'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Briefcase,
  Code,
  FolderGit2,
  Users2,
  FileText,
  MessageSquare,
  Award,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react'

export interface InterviewTrack {
  id: string
  slug: string
  title: string
  description: string
  category: 'general' | 'technical' | 'behavioral' | 'mock'
  difficulty: string
  difficultyVariant: 'default' | 'success' | 'warning' | 'info'
  duration: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  questionCount: number
}

const INTERVIEW_TRACKS: InterviewTrack[] = [
  {
    id: 'hr',
    slug: 'hr-interviews',
    title: 'HR Interviews',
    description: 'Master personal introductions, career motivation, strengths, weaknesses, and company alignment questions.',
    category: 'general',
    difficulty: 'B1 · Intermediate',
    difficultyVariant: 'info',
    duration: '15 mins',
    icon: GraduationCap,
    questionCount: 6,
  },
  {
    id: 'internship',
    slug: 'internship-interviews',
    title: 'Internship Interviews',
    description: 'Tailored for first-time applicants: explain academic coursework, project motivation, and willingness to learn.',
    category: 'general',
    difficulty: 'A2-B1 · Foundational',
    difficultyVariant: 'success',
    duration: '15 mins',
    icon: Briefcase,
    questionCount: 5,
  },
  {
    id: 'technical',
    slug: 'technical-explanations',
    title: 'Technical Explanations',
    description: 'Practice explaining complex engineering concepts, data structures, and algorithms in plain, articulate English.',
    category: 'technical',
    difficulty: 'B2 · Advanced',
    difficultyVariant: 'warning',
    duration: '20 mins',
    icon: Code,
    questionCount: 6,
  },
  {
    id: 'project',
    slug: 'project-walkthroughs',
    title: 'Project Walkthroughs',
    description: 'Structure end-to-end narratives: problem statement, system design choices, your contribution, and lessons learned.',
    category: 'technical',
    difficulty: 'B1-B2 · Intermediate',
    difficultyVariant: 'info',
    duration: '20 mins',
    icon: FolderGit2,
    questionCount: 5,
  },
  {
    id: 'behavioral',
    slug: 'behavioral-situational',
    title: 'Behavioral & Situational',
    description: 'Answer conflict resolution, team collaboration, and deadline management questions using the STAR framework.',
    category: 'behavioral',
    difficulty: 'B2 · Upper Intermediate',
    difficultyVariant: 'warning',
    duration: '20 mins',
    icon: Users2,
    questionCount: 6,
  },
  {
    id: 'resume',
    slug: 'resume-based',
    title: 'Resume-Based Round',
    description: 'Field in-depth questions on your resume bullet points, certifications, hackathon projects, and tech stack proficiencies.',
    category: 'general',
    difficulty: 'B1-B2 · Intermediate',
    difficultyVariant: 'info',
    duration: '15 mins',
    icon: FileText,
    questionCount: 5,
  },
  {
    id: 'communication',
    slug: 'communication-rounds',
    title: 'Communication Rounds',
    description: 'Demonstrate persuasion, clear articulation, concise summaries, and executive presence under time limits.',
    category: 'behavioral',
    difficulty: 'B2 · Professional',
    difficultyVariant: 'warning',
    duration: '15 mins',
    icon: MessageSquare,
    questionCount: 5,
  },
  {
    id: 'full-mock',
    slug: 'full-mock-interview',
    title: 'Full Mock Interview',
    description: 'Comprehensive placement simulation: HR kickoff, technical walkthrough, situational questions, and closing remarks.',
    category: 'mock',
    difficulty: 'B2-C1 · Placement Ready',
    difficultyVariant: 'default',
    duration: '30 mins',
    icon: Award,
    questionCount: 8,
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All Tracks' },
  { id: 'general', label: 'General & HR' },
  { id: 'technical', label: 'Technical & Projects' },
  { id: 'behavioral', label: 'Behavioral & Situational' },
  { id: 'mock', label: 'Full Simulations' },
]

export default function InterviewArenaPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredTracks = selectedCategory === 'all'
    ? INTERVIEW_TRACKS
    : INTERVIEW_TRACKS.filter((t) => t.category === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-sv-primary">
            Placement Readiness
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Interview Arena</h1>
        <p className="text-sv-text-secondary mt-1">
          Interactive, AI-powered mock interviews designed for campus placements. Choose a track, customize your target role, and practice structured responses.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sv-border" role="tablist" aria-label="Filter interview tracks">
        <Filter className="h-4 w-4 text-sv-text-secondary mr-1 flex-shrink-0" aria-hidden="true" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              selectedCategory === cat.id
                ? 'bg-sv-primary text-white font-semibold'
                : 'text-sv-text-secondary hover:bg-gray-100 hover:text-sv-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTracks.map((track) => {
          const Icon = track.icon
          return (
            <Card key={track.id} hover className="flex flex-col justify-between border-sv-border">
              <div>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 text-sv-primary flex-shrink-0">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{track.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={track.difficultyVariant}>{track.difficulty}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <CardDescription className="text-sm leading-relaxed">
                    {track.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-xs text-sv-text-secondary mt-4 pt-3 border-t border-sv-border/60">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {track.duration}
                    </span>
                    <span>•</span>
                    <span>{track.questionCount} Guided Questions</span>
                    <span>•</span>
                    <span>STAR Method Feedback</span>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-3">
                <Link href={`/speakverse/interview/${track.slug}`} className="w-full">
                  <Button fullWidth className="group">
                    Start {track.title}
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Formative Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-sv p-4 text-xs text-sv-text-secondary">
        <strong className="text-sv-primary font-medium">Formative Feedback Notice:</strong> All scores and suggestions in the Interview Arena are provided for learning and formative coaching. They do not constitute an official employment evaluation or guaranteed placement certification.
      </div>
    </div>
  )
}
