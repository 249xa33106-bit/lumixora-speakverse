'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Sparkles,
  RotateCw,
  Mic,
  Filter,
  Eye,
} from 'lucide-react'

interface VocabWord {
  id: string
  word: string
  partOfSpeech: string
  pronunciation: string
  category: 'Everyday' | 'Academic' | 'Professional' | 'Interview' | 'Collocations' | 'Phrasal Verbs' | 'Formal vs Informal'
  definition: string
  exampleSentence: string
  teluguMeaning: string
  learnedInSession?: string
}

const VOCAB_DATA: VocabWord[] = [
  // Interview Vocab
  {
    id: '1',
    word: 'Spearhead',
    partOfSpeech: 'verb',
    pronunciation: '/ˈspɪər.hed/',
    category: 'Interview',
    definition: 'To lead an attack or be the leader in an organized activity or project.',
    exampleSentence: 'I spearheaded the cloud migration initiative for our final year capstone project.',
    teluguMeaning: 'ముందంజ వేసి నాయకత్వం వహించు (to lead/pioneer).',
    learnedInSession: 'Mock Interview Round 2',
  },
  {
    id: '2',
    word: 'Pivot',
    partOfSpeech: 'verb / noun',
    pronunciation: '/ˈpɪv.ət/',
    category: 'Interview',
    definition: 'To change strategy, direction, or architectural approach swiftly when faced with a roadblock.',
    exampleSentence: 'When our initial API failed under load, we pivoted to an asynchronous queue model.',
    teluguMeaning: 'వ్యూహాత్మకంగా దిశ మార్చుకోవడం (strategic shift).',
    learnedInSession: 'Behavioral Round Practice',
  },
  // Professional
  {
    id: '3',
    word: 'Leverage',
    partOfSpeech: 'verb',
    pronunciation: '/ˈlev.ər.ɪdʒ/',
    category: 'Professional',
    definition: 'To use something to maximum advantage; utilize resources strategically.',
    exampleSentence: 'We leveraged Redis caching to reduce latency by over forty percent.',
    teluguMeaning: 'వనరులను లేదా ప్రయోజనాలను సమర్థవంతంగా వినియోగించుకోవడం.',
    learnedInSession: 'Technical Explanation Lab',
  },
  {
    id: '4',
    word: 'Mitigate',
    partOfSpeech: 'verb',
    pronunciation: '/ˈmɪt.ɪ.ɡeɪt/',
    category: 'Professional',
    definition: 'To make something less harmful, severe, or painful.',
    exampleSentence: 'Implementing input validation helps mitigate common security vulnerabilities.',
    teluguMeaning: 'తీవ్రతను తగ్గించు (lessen impact).',
    learnedInSession: 'Campus Stand-up Roleplay',
  },
  // Academic
  {
    id: '5',
    word: 'Corroborate',
    partOfSpeech: 'verb',
    pronunciation: '/kəˈrɒb.ə.reɪt/',
    category: 'Academic',
    definition: 'To confirm or give support to a statement, theory, or finding with evidence.',
    exampleSentence: 'Our experimental benchmark results corroborate the theoretical claims.',
    teluguMeaning: 'సాక్ష్యాలతో బలపరచు / నిర్ధారించు.',
  },
  {
    id: '6',
    word: 'Synthesize',
    partOfSpeech: 'verb',
    pronunciation: '/ˈsɪn.θə.saɪz/',
    category: 'Academic',
    definition: 'To combine a range of different ideas or data points into a coherent whole.',
    exampleSentence: 'In the literature review, the team synthesized findings from twelve research papers.',
    teluguMeaning: 'వివిధ సమాచారాలను ఏకీకృతం చేయు.',
  },
  // Collocations
  {
    id: '7',
    word: 'Make a breakthrough',
    partOfSpeech: 'collocation',
    pronunciation: '/meɪk ə ˈbreɪk.θruː/',
    category: 'Collocations',
    definition: 'To achieve an important and sudden advance or discovery in technical work.',
    exampleSentence: 'After extensive testing, the research lab made a breakthrough in model optimization.',
    teluguMeaning: 'ముఖ్యమైన పురోగతిని సాధించు.',
  },
  {
    id: '8',
    word: 'Conduct an investigation',
    partOfSpeech: 'collocation',
    pronunciation: '/kənˈdʌkt æn ɪnˌves.tɪˈɡeɪ.ʃən/',
    category: 'Collocations',
    definition: 'To systematically examine, research, or inspect a technical failure or discrepancy.',
    exampleSentence: 'The engineering team conducted a root-cause investigation into the server outage.',
    teluguMeaning: 'క్షుణ్ణంగా విచారణ జరుపు.',
  },
  // Phrasal Verbs
  {
    id: '9',
    word: 'Follow through',
    partOfSpeech: 'phrasal verb',
    pronunciation: '/ˈfɒl.əʊ θruː/',
    category: 'Phrasal Verbs',
    definition: 'To continue an undertaking until completion; fulfill an agreement or pledge.',
    exampleSentence: 'Great team players consistently follow through on their commitments.',
    teluguMeaning: 'ప్రారంభించిన పనిని చివరివరకు పూర్తి చేయు.',
    learnedInSession: 'Team Meeting Scenario',
  },
  {
    id: '10',
    word: 'Hammer out',
    partOfSpeech: 'phrasal verb',
    pronunciation: '/ˈhæm.ər aʊt/',
    category: 'Phrasal Verbs',
    definition: 'To reach agreement or solve a problem after a lot of discussion or debate.',
    exampleSentence: 'Both teams spent three hours hammering out the database contract details.',
    teluguMeaning: 'సుదీర్ఘ చర్చల ద్వారా ఒక ఒప్పందానికి వచ్చు.',
  },
  // Formal vs Informal
  {
    id: '11',
    word: 'Ascertain vs Find out',
    partOfSpeech: 'formal comparison',
    pronunciation: '/ˌæs.əˈteɪn/',
    category: 'Formal vs Informal',
    definition: 'Formal: "ascertain" is suitable for client reports; informal: "find out" is conversational.',
    exampleSentence: 'Formal: Please ascertain the root cause. Informal: Let us find out what broke.',
    teluguMeaning: 'పరిశీలించి నిర్ధారించుకోవడం (రూపభేదాలు).',
  },
  {
    id: '12',
    word: 'Commence vs Start',
    partOfSpeech: 'formal comparison',
    pronunciation: '/kəˈmens/',
    category: 'Formal vs Informal',
    definition: 'Formal: "commence" is ideal for professional schedules, emails, and interview pitches.',
    exampleSentence: 'The technical symposium will commence at 9:00 AM sharp.',
    teluguMeaning: 'ప్రారంభించుట (ఔపచారిక పదం).',
  },
  // Everyday
  {
    id: '13',
    word: 'Articulate',
    partOfSpeech: 'adjective / verb',
    pronunciation: '/ɑːˈtɪk.jə.lət/',
    category: 'Everyday',
    definition: 'Able to express thoughts and ideas clearly and effectively in speech or writing.',
    exampleSentence: 'She gave an articulate and confident presentation to the interview panel.',
    teluguMeaning: 'విషయాన్ని స్పష్టంగా వ్యక్తీకరించగలగడం.',
    learnedInSession: 'Introductory Dialogue',
  },
]

const CATEGORIES = [
  'All',
  'Interview',
  'Professional',
  'Academic',
  'Collocations',
  'Phrasal Verbs',
  'Formal vs Informal',
  'Everyday',
]

export default function VocabularyPage() {
  const [selectedCat, setSelectedCat] = useState<string>('All')
  const [flashcardMode, setFlashcardMode] = useState<boolean>(false)
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<number>(0)
  const [flipped, setFlipped] = useState<boolean>(false)

  const filteredWords = selectedCat === 'All'
    ? VOCAB_DATA
    : VOCAB_DATA.filter((w) => w.category === selectedCat)

  const learnedWords = VOCAB_DATA.filter((w) => Boolean(w.learnedInSession))

  const handleNextFlashcard = () => {
    setFlipped(false)
    setCurrentFlashcardIndex((prev) => (prev + 1) % filteredWords.length)
  }

  const handlePrevFlashcard = () => {
    setFlipped(false)
    setCurrentFlashcardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length)
  }

  const currentFlashcard = filteredWords[currentFlashcardIndex] || filteredWords[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-teal-100 text-sv-accent">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-sv-accent">
              Lexical Toolkit
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">Vocabulary Vault</h1>
          <p className="text-sv-text-secondary mt-1">
            Build active, interview-ready English vocabulary. Categorized by placement topics, collocations, and speaking sessions.
          </p>
        </div>

        {/* Flashcard Toggle */}
        <Button
          variant={flashcardMode ? 'primary' : 'secondary'}
          onClick={() => {
            setFlashcardMode(!flashcardMode)
            setFlipped(false)
            setCurrentFlashcardIndex(0)
          }}
          className="self-start sm:self-auto"
        >
          <RotateCw className="h-4 w-4 mr-1.5" />
          {flashcardMode ? 'Exit Flashcard Mode' : 'Flashcard Mode'}
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sv-border" role="tablist">
        <Filter className="h-4 w-4 text-sv-text-secondary mr-1 flex-shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={selectedCat === cat}
            onClick={() => {
              setSelectedCat(cat)
              setCurrentFlashcardIndex(0)
              setFlipped(false)
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              selectedCat === cat
                ? 'bg-sv-primary text-white font-semibold'
                : 'text-sv-text-secondary hover:bg-gray-100 hover:text-sv-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FLASHCARD MODE VIEW */}
      {flashcardMode && currentFlashcard ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs text-sv-text-secondary font-medium">
            <span>
              Card {currentFlashcardIndex + 1} of {filteredWords.length} ({selectedCat})
            </span>
            <span>Click card to reveal definition & Telugu explanation</span>
          </div>

          {/* Flashcard Container */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer min-h-[280px] p-8 rounded-sv-lg border-2 border-sv-primary/30 bg-white shadow-lg flex flex-col justify-between transition-all hover:border-sv-primary"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setFlipped(!flipped)
            }}
            aria-label={`Flashcard for ${currentFlashcard.word}. Press Enter to flip.`}
          >
            <div className="flex items-center justify-between">
              <Badge variant="info">{currentFlashcard.category}</Badge>
              <span className="text-xs text-sv-text-secondary font-mono">
                {currentFlashcard.pronunciation}
              </span>
            </div>

            <div className="text-center py-6">
              {!flipped ? (
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-sv-text">{currentFlashcard.word}</h2>
                  <span className="text-xs italic text-sv-text-secondary">({currentFlashcard.partOfSpeech})</span>
                  <p className="text-xs text-sv-primary font-medium mt-4 flex items-center justify-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> Tap to flip card
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-base text-sv-text font-medium leading-relaxed">
                    {currentFlashcard.definition}
                  </p>
                  <div className="p-3 bg-blue-50 rounded-lg text-xs text-sv-text text-left">
                    <strong className="text-sv-primary block mb-0.5">Example in context:</strong>
                    &ldquo;{currentFlashcard.exampleSentence}&rdquo;
                  </div>
                  <div className="text-xs text-sv-text-secondary text-left border-t border-sv-border pt-2">
                    <strong className="text-sv-text block">తెలుగు అర్థం (Telugu Meaning):</strong>
                    <span className="telugu-text">{currentFlashcard.teluguMeaning}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[11px] text-sv-text-secondary">
              {flipped ? 'Tap card again to see word' : 'Spacebar or click to flip'}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={handlePrevFlashcard} disabled={filteredWords.length <= 1}>
              Previous Card
            </Button>
            <Button onClick={handleNextFlashcard} disabled={filteredWords.length <= 1}>
              Next Card
            </Button>
          </div>
        </div>
      ) : (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWords.map((item) => (
            <Card key={item.id} hover className="flex flex-col justify-between border-sv-border">
              <div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="info">{item.category}</Badge>
                    <span className="text-[11px] font-mono text-sv-text-secondary">
                      {item.pronunciation}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <CardTitle className="text-xl font-bold text-sv-text">{item.word}</CardTitle>
                    <span className="text-xs italic text-sv-text-secondary">({item.partOfSpeech})</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-sv-text leading-relaxed font-medium">
                    {item.definition}
                  </p>

                  <div className="bg-gray-50 border border-sv-border/80 rounded-lg p-2.5 text-xs text-sv-text-secondary">
                    <span className="font-semibold text-sv-text block mb-0.5 text-[11px]">Usage:</span>
                    &ldquo;{item.exampleSentence}&rdquo;
                  </div>

                  <div className="bg-blue-50/50 rounded-lg p-2 text-[11px] text-sv-text-secondary">
                    <span className="font-semibold text-sv-primary block mb-0.5">తెలుగు అర్థం:</span>
                    <span className="telugu-text">{item.teluguMeaning}</span>
                  </div>
                </CardContent>
              </div>

              {item.learnedInSession && (
                <CardFooter className="pt-2 text-[11px] text-sv-accent font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Learned in: {item.learnedInSession}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Words Learned in Speaking Sessions Section */}
      <section className="space-y-4 pt-6 border-t border-sv-border" aria-label="Words learned in speaking sessions">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-green-100 text-sv-success">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-sv-text">Words Learned in Speaking Sessions</h2>
            <p className="text-xs text-sv-text-secondary">
              Lexicon discovered and reinforced through your authentic conversation roleplays and interview sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {learnedWords.map((w) => (
            <Card key={w.id} className="border-green-200 bg-white">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-sv-text">{w.word}</span>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-sv-text-secondary line-clamp-2">
                  {w.definition}
                </p>
                <div className="text-[10px] text-sv-accent font-medium pt-1 border-t border-gray-100 flex items-center gap-1">
                  <Mic className="h-3 w-3" /> {w.learnedInSession}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
