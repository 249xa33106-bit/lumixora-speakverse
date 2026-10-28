import type { StationId } from './ClassroomScene'

const STATIONS: Array<{ id: StationId; label: string; desc: string; emoji: string; color: string }> = [
  { id: 'grammar',      label: 'Grammar & Vocabulary',  desc: 'Sentence construction, vocabulary, common mistakes', emoji: '📚', color: 'bg-blue-50 border-sv-primary text-sv-primary' },
  { id: 'conversation', label: 'Conversation Corner',    desc: 'Introductions, everyday and professional English',   emoji: '💬', color: 'bg-teal-50 border-sv-accent text-sv-accent' },
  { id: 'interview',    label: 'Interview Room',         desc: 'HR, technical and behavioral mock interviews',       emoji: '🎯', color: 'bg-purple-50 border-purple-600 text-purple-600' },
  { id: 'presentation', label: 'Presentation Stage',     desc: 'Speak on a topic, organise ideas, get feedback',    emoji: '🎤', color: 'bg-amber-50 border-sv-warning text-sv-warning' },
  { id: 'listening',    label: 'Listening Station',      desc: 'Comprehension exercises, transcripts, replay',       emoji: '🎧', color: 'bg-green-50 border-sv-success text-sv-success' },
]

interface ClassroomFallbackProps {
  onStationClick: (station: StationId) => void
  activeStation: StationId | null
}

export function ClassroomFallback({ onStationClick, activeStation }: ClassroomFallbackProps) {
  return (
    <div className="w-full">
      <div className="text-center mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sv">
        <p className="text-sm text-sv-warning font-medium">3D classroom unavailable on this device. Using 2D station selector.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onStationClick(s.id)}
            className={`flex items-start gap-3 p-4 rounded-sv border-2 text-left transition-all ${
              activeStation === s.id ? s.color + ' shadow-md' : 'bg-sv-surface border-sv-border hover:border-current'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary`}
          >
            <span className="text-3xl">{s.emoji}</span>
            <div>
              <div className="font-semibold text-sv-text">{s.label}</div>
              <div className="text-xs text-sv-text-secondary mt-0.5">{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
