'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Layers,
  Percent,
  CheckCheck,
} from 'lucide-react'

interface GrammarTopic {
  id: string
  title: string
  slug: string
  description: string
  level: string
  masteryPct: number
  lessonsCount: number
  commonPitfall: string
  teluguNote: string
}

const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'sentence-structure',
    title: 'Sentence Structure',
    slug: 'sentence-structure',
    description: 'Master Subject-Verb-Object (SVO) foundations, compound clauses, and complex subordinating phrases.',
    level: 'A1-A2',
    masteryPct: 85,
    lessonsCount: 6,
    commonPitfall: 'Incorrect word order when translating directly from Telugu or Hindi sentence patterns.',
    teluguNote: 'తెలుగులో క్రియ చివరిలో వస్తుంది (SOV), కానీ ఆంగ్లంలో క్రియ మధ్యలో వస్తుంది (SVO).',
  },
  {
    id: 'tenses',
    title: 'Tenses & Time References',
    slug: 'tenses',
    description: 'Navigate Simple Present, Past Continuous, Present Perfect, and future intent with clarity.',
    level: 'A2-B1',
    masteryPct: 72,
    lessonsCount: 8,
    commonPitfall: 'Overusing present continuous ("I am knowing") instead of simple present ("I know").',
    teluguNote: 'స్టేటివ్ వెర్బ్స్ (Stative verbs) తో సాధారణంగా Continuous Tense వాడకూడదు.',
  },
  {
    id: 'articles-prepositions',
    title: 'Articles & Prepositions',
    slug: 'articles-prepositions',
    description: 'Accurate usage of a, an, the, alongside spatial and temporal prepositions (in, on, at, since, for).',
    level: 'A2-B1',
    masteryPct: 68,
    lessonsCount: 7,
    commonPitfall: 'Omitting "the" before specific singular nouns or misplacing "since" and "for".',
    teluguNote: 'కచ్చితమైన సమయం (point of time) కి "since", వ్యవధి (duration) కి "for" వాడాలి.',
  },
  {
    id: 'question-formation',
    title: 'Question Formation',
    slug: 'question-formation',
    description: 'Invert auxiliaries correctly for Wh- questions, yes/no queries, and polite professional inquiries.',
    level: 'B1',
    masteryPct: 80,
    lessonsCount: 5,
    commonPitfall: 'Forming questions without auxiliary verbs: saying "Why you are late?" instead of "Why are you late?".',
    teluguNote: 'ప్రశ్నలలో సహాయక క్రియ (auxiliary verb) కర్త (subject) కంటే ముందు రావాలి.',
  },
  {
    id: 'subject-verb-agreement',
    title: 'Subject-Verb Agreement',
    slug: 'subject-verb-agreement',
    description: 'Ensure singular and plural subjects align with verbs, especially with collective nouns and indefinite pronouns.',
    level: 'B1',
    masteryPct: 75,
    lessonsCount: 6,
    commonPitfall: 'Singular indefinite pronouns (everyone, someone, each) treated as plural.',
    teluguNote: '"Everyone" లేదా "Each" ఎల్లప్పుడూ ఏకవచన క్రియను (singular verb) తీసుకుంటాయి.',
  },
  {
    id: 'connectors',
    title: 'Connectors & Transition Words',
    slug: 'connectors',
    description: 'Link arguments smoothly using contrast, causation, and addition (however, therefore, whereas, consequently).',
    level: 'B1-B2',
    masteryPct: 65,
    lessonsCount: 5,
    commonPitfall: 'Using redundant double connectors like "Although... but..." in the same sentence.',
    teluguNote: '"Although" మరియు "but" రెండూ ఒకే వాక్యంలో వాడకూడదు.',
  },
  {
    id: 'common-errors',
    title: 'Common Indian English Errors',
    slug: 'common-errors',
    description: 'Address colloquial Indian English habits: redundant prepositions ("revert back"), tag questions ("no?"), and progressive statives.',
    level: 'B1-B2',
    masteryPct: 90,
    lessonsCount: 7,
    commonPitfall: 'Phrases like "discuss about", "pass out from college", "order for food".',
    teluguNote: '"Discuss" తర్వాత "about" రాదు. కేవలం "discuss the problem" అనాలి.',
  },
]

export default function GrammarPage() {
  const [showTelugu, setShowTelugu] = useState(true)

  const coveredCount = GRAMMAR_TOPICS.filter((t) => t.masteryPct >= 70).length
  const totalTopics = GRAMMAR_TOPICS.length
  const avgAccuracy = Math.round(
    GRAMMAR_TOPICS.reduce((acc, t) => acc + t.masteryPct, 0) / totalTopics
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-100 text-sv-primary">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-sv-primary">
              Accuracy Foundation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Grammar Essentials</h1>
          <p className="text-sv-text-secondary mt-1">
            Build bulletproof grammatical accuracy with bite-sized lessons, interactive correction, and bilingual Telugu explanations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTelugu(!showTelugu)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-sv-border bg-sv-surface hover:bg-gray-50 text-sv-text transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-sv-primary" />
          {showTelugu ? 'Hide Telugu Explanations' : 'Show Telugu Explanations'}
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-sv-primary">
              <Layers className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">
                {coveredCount} of {totalTopics}
              </div>
              <p className="text-xs text-sv-text-secondary">Topics Covered (≥70% Mastery)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-50 text-sv-accent">
              <Percent className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">{avgAccuracy}%</div>
              <p className="text-xs text-sv-text-secondary">Average Grammar Accuracy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sv-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-sv-success">
              <CheckCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="text-2xl font-bold text-sv-text">43</div>
              <p className="text-xs text-sv-text-secondary">Exercises Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GRAMMAR_TOPICS.map((topic) => (
          <Card key={topic.id} hover className="flex flex-col justify-between border-sv-border">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="info">{topic.level}</Badge>
                  <span className="text-xs text-sv-text-secondary font-medium">
                    {topic.lessonsCount} Lessons
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-sv-text">
                  {topic.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <CardDescription className="text-xs leading-relaxed">
                  {topic.description}
                </CardDescription>

                {/* Mastery Progress Bar */}
                <div className="pt-1">
                  <Progress
                    value={topic.masteryPct}
                    size="sm"
                    label="Topic Mastery"
                    showValue
                  />
                </div>

                {/* Common Pitfall */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-sv-text">
                  <div className="flex items-center gap-1 font-semibold text-sv-warning mb-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Common Pitfall:
                  </div>
                  <p className="text-[11px] text-sv-text-secondary">{topic.commonPitfall}</p>
                </div>

                {/* Bilingual Telugu note */}
                {showTelugu && (
                  <div className="bg-blue-50/60 border border-blue-200/70 rounded-lg p-2.5 text-xs text-sv-text">
                    <span className="text-[10px] font-semibold text-sv-primary uppercase tracking-wide block mb-0.5">
                      తెలుగు వివరణ (Telugu Note):
                    </span>
                    <p className="telugu-text text-xs text-sv-text-secondary">{topic.teluguNote}</p>
                  </div>
                )}
              </CardContent>
            </div>

            <CardFooter className="pt-2">
              <Link
                href={`/speakverse/learn?skill=grammar&topic=${topic.slug}`}
                className="w-full"
              >
                <Button fullWidth size="sm" variant="secondary" className="group">
                  Practice Topic Lessons
                  <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
