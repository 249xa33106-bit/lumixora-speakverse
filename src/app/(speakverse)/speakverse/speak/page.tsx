import Link from 'next/link'
import {
  MessageSquareText,
  MessagesSquare,
  Users,
  Sparkles,
  Timer,
  Volume2,
  ArrowRight,
  Bot,
  ShieldCheck,
  Headphones,
} from 'lucide-react'

interface ModeCard {
  id: string
  title: string
  description: string
  difficulty: string
  difficultyColor: string
  duration: string
  icon: any
  tag: string
}

const SPEAK_MODES: ModeCard[] = [
  {
    id: 'guided',
    title: 'Guided Conversation',
    description: 'Structured step-by-step dialogue with AI coach hints, sentence starters, and prompt scaffolds.',
    difficulty: 'A2 - B1',
    difficultyColor: 'bg-blue-100 text-[#2458A6] border-blue-200',
    duration: '5 - 7 mins',
    icon: MessageSquareText,
    tag: 'Recommended for Beginners',
  },
  {
    id: 'free',
    title: 'Free Conversation',
    description: 'Casual, open-ended discussion on campus life, career goals, personal hobbies, and current technology.',
    difficulty: 'B1 - B2',
    difficultyColor: 'bg-emerald-100 text-[#167D72] border-emerald-200',
    duration: '5 - 10 mins',
    icon: MessagesSquare,
    tag: 'Daily Fluency',
  },
  {
    id: 'scenario',
    title: 'Scenario Role-play',
    description: 'Realistic workplace and academic simulations: team stand-ups, professor office hours, and project updates.',
    difficulty: 'B1 - C1',
    difficultyColor: 'bg-amber-100 text-[#9A6216] border-amber-200',
    duration: '7 - 10 mins',
    icon: Users,
    tag: 'Professional Skills',
  },
  {
    id: 'topic',
    title: 'Speak from Topic',
    description: 'Formulate arguments and present viewpoints on engaging engineering and societal themes.',
    difficulty: 'B1 - B2',
    difficultyColor: 'bg-purple-100 text-purple-700 border-purple-200',
    duration: '5 mins',
    icon: Sparkles,
    tag: 'Thought Organization',
  },
  {
    id: 'challenge',
    title: '1-Minute Challenge',
    description: 'Timed fluency drill. Speak continuously for 60 seconds with coherent idea progression and minimal pauses.',
    difficulty: 'B2 - C1',
    difficultyColor: 'bg-rose-100 text-rose-700 border-rose-200',
    duration: '3 - 5 mins',
    icon: Timer,
    tag: 'Speed & Spontaneity',
  },
  {
    id: 'pronunciation',
    title: 'Pronunciation Practice',
    description: 'Targeted articulation of challenging vowel sounds, consonant clusters, and syllable stress patterns.',
    difficulty: 'All Levels',
    difficultyColor: 'bg-teal-100 text-[#167D72] border-teal-200',
    duration: '5 mins',
    icon: Volume2,
    tag: 'Clarity & Intelligibility',
  },
]

export default function SpeakStudioPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DFE5EE] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2458A6]/10 text-[#2458A6]">
              <Bot className="w-3.5 h-3.5" />
              Speak Studio · Interactive AI Coach
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17243A]">
              Speak English with Confidence
            </h1>
            <p className="text-[#596579] max-w-2xl text-sm sm:text-base">
              Choose your practice format. Every session pairs you with SpeakVerse Coach powered by
              formative AI scaffolding. Practice by typing or voice fallback anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-xs text-[#596579] bg-[#F7F9FC] px-4 py-2.5 rounded-xl border border-[#DFE5EE]">
              <ShieldCheck className="w-4 h-4 text-[#167D72]" />
              <span>Safe Practice · Typed & Voice Modes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SPEAK_MODES.map((mode) => {
          const Icon = mode.icon
          return (
            <div
              key={mode.id}
              className="group bg-white rounded-2xl p-6 border border-[#DFE5EE] shadow-sm hover:shadow-md hover:border-[#2458A6]/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#F7F9FC] border border-[#DFE5EE] flex items-center justify-center text-[#2458A6] group-hover:bg-[#2458A6] group-hover:text-white transition-colors duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${mode.difficultyColor}`}
                  >
                    {mode.difficulty}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-medium text-[#167D72]">{mode.tag}</span>
                  <h2 className="text-lg font-bold text-[#17243A] group-hover:text-[#2458A6] transition-colors duration-150">
                    {mode.title}
                  </h2>
                  <p className="text-sm text-[#596579] mt-2 line-clamp-3 leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#DFE5EE] flex items-center justify-between">
                <span className="text-xs text-[#596579] font-medium flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#596579]" />
                  {mode.duration}
                </span>

                <Link
                  href={`/speakverse/speak/${mode.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2458A6] text-white hover:bg-[#1a4280] focus:ring-2 focus:ring-[#2458A6] focus:ring-offset-2 transition-all min-h-[44px]"
                  aria-label={`Start ${mode.title}`}
                >
                  Start Mode
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formative disclaimer notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#2458A6] flex items-center justify-between">
        <span>
          <strong>Pedagogical Guarantee:</strong> All AI evaluations in SpeakVerse are formative
          learning feedback designed for skill growth. Scores reflect current practice evidence and
          are never claimed as verified CEFR certifications without proctored assessment.
        </span>
      </div>
    </div>
  )
}
