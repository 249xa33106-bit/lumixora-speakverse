'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Headphones,
  Subtitles,
  Clock,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

interface ListeningActivity {
  id: string
  title: string
  description: string
  skillLevel: string
  duration: string
  captionsAvailable: boolean
  category: 'comprehension' | 'detail' | 'workplace' | 'phonetics'
  audioPromptPreview: string
}

const LISTENING_ACTIVITIES: ListeningActivity[] = [
  {
    id: 'select-meaning',
    title: 'Listen & Select Meaning',
    description: 'Listen to a natural conversational dialogue and choose the most accurate contextual meaning of phrases and idiomatic expressions.',
    skillLevel: 'A2 · Elementary',
    duration: '5 mins',
    captionsAvailable: true,
    category: 'comprehension',
    audioPromptPreview: 'Two students discussing their semester exam preparation strategy.',
  },
  {
    id: 'missing-words',
    title: 'Complete Missing Words',
    description: 'Listen to short spoken sentences and fill in missing prepositions, articles, and verb tenses from speech recognition prompts.',
    skillLevel: 'B1 · Intermediate',
    duration: '6 mins',
    captionsAvailable: false,
    category: 'detail',
    audioPromptPreview: 'An engineer describing how cloud containers improve application reliability.',
  },
  {
    id: 'main-idea',
    title: 'Identify Main Idea',
    description: 'Listen to a 90-second technical lecture or team update, then separate the central core thesis from supporting background details.',
    skillLevel: 'B1 · Intermediate',
    duration: '7 mins',
    captionsAvailable: true,
    category: 'comprehension',
    audioPromptPreview: 'A professor delivering an overview on ethical considerations in AI modeling.',
  },
  {
    id: 'summarize-conversation',
    title: 'Summarize Conversation',
    description: 'Listen to an authentic meeting exchange between a project manager and lead architect, then synthesize key outcomes into 3 bullet points.',
    skillLevel: 'B2 · Upper Intermediate',
    duration: '8 mins',
    captionsAvailable: true,
    category: 'comprehension',
    audioPromptPreview: 'A sprint retrospective meeting debating database migration timelines.',
  },
  {
    id: 'workplace-instructions',
    title: 'Workplace Instructions Q&A',
    description: 'Follow complex multi-step procedural audio instructions (lab safety, deployment protocols, customer escalations) and answer accuracy checks.',
    skillLevel: 'B1-B2 · Professional',
    duration: '7 mins',
    captionsAvailable: true,
    category: 'workplace',
    audioPromptPreview: 'Onboarding coordinator reviewing first-week workstation and security setup.',
  },
  {
    id: 'similar-sounds',
    title: 'Distinguish Similar Sounds',
    description: 'Minimal pair phonetics training: differentiate subtle vowel and consonant distinctions (e.g. ship vs sheep, reach vs rich, think vs sink).',
    skillLevel: 'A1-A2 · Foundational',
    duration: '5 mins',
    captionsAvailable: false,
    category: 'phonetics',
    audioPromptPreview: 'Phonetic comparison of 8 minimal pairs with natural Indian accent nuances.',
  },
]

export default function ListeningLabPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)

  const handleSimulateAudio = (id: string) => {
    setPlayingPreview(id)
    toast.info('Playing simulated listening audio sample...')
    setTimeout(() => {
      setPlayingPreview(null)
    }, 3000)
  }

  const filtered = selectedFilter === 'all'
    ? LISTENING_ACTIVITIES
    : LISTENING_ACTIVITIES.filter((a) => a.category === selectedFilter)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-lg bg-teal-100 text-sv-accent">
            <Headphones className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-sv-accent">
            Audio Comprehension
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Listening Lab</h1>
        <p className="text-sv-text-secondary mt-1">
          Sharpen your ear for natural spoken English, acoustic nuances, workplace instructions, and technical discussions.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sv-border" role="tablist" aria-label="Filter listening activities">
        <Filter className="h-4 w-4 text-sv-text-secondary mr-1 flex-shrink-0" aria-hidden="true" />
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'comprehension', label: 'Comprehension & Synthesis' },
          { id: 'detail', label: 'Detail & Dictation' },
          { id: 'workplace', label: 'Workplace Audio' },
          { id: 'phonetics', label: 'Phonetics & Sounds' },
        ].map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={selectedFilter === f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              selectedFilter === f.id
                ? 'bg-sv-accent text-white font-semibold'
                : 'text-sv-text-secondary hover:bg-gray-100 hover:text-sv-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((activity) => (
          <Card key={activity.id} hover className="flex flex-col justify-between border-sv-border">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="info">{activity.skillLevel}</Badge>
                  <div className="flex items-center gap-3 text-xs text-sv-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {activity.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Subtitles className={`h-3.5 w-3.5 ${activity.captionsAvailable ? 'text-sv-success' : 'text-gray-400'}`} aria-hidden="true" />
                      {activity.captionsAvailable ? 'Captions Available' : 'No Captions'}
                    </span>
                  </div>
                </div>

                <CardTitle className="text-lg font-bold text-sv-text">
                  {activity.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {activity.description}
                </CardDescription>

                <div className="bg-gray-50 border border-sv-border rounded-lg p-3 text-xs space-y-1.5">
                  <span className="font-semibold text-sv-text block">Audio Scenario Preview:</span>
                  <p className="text-sv-text-secondary italic">&ldquo;{activity.audioPromptPreview}&rdquo;</p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleSimulateAudio(activity.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-sv-accent font-medium hover:underline focus-visible:outline-none"
                    >
                      {playingPreview === activity.id ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                          Playing audio sample...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Listen to 5s Sample
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-3">
              <Link href={`/speakverse/learn?skill=listening&activity=${activity.id}`} className="w-full">
                <Button fullWidth className="group bg-sv-accent hover:bg-teal-700">
                  Start Practice
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Accessibility & Voice Policy Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-sv p-4 text-xs text-sv-text-secondary space-y-1">
        <strong className="text-sv-accent font-medium">Listening Lab Accessibility Notice:</strong> All exercises feature playback speed adjustment (0.75x, 1x, 1.25x) and text transcript fallback for learners who have hearing accommodations or noisy environments.
      </div>
    </div>
  )
}
