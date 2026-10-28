'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Send, Mic, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react'

export default function GroupDiscussionPage() {
  const [topic, setTopic] = useState('Will AI Replace Junior Software Engineers or Augment Them?')
  const [messages, setMessages] = useState([
    { speaker: 'Moderator', role: 'moderator', text: 'Welcome to this Group Discussion round. The topic is: "Will AI Replace Junior Software Engineers or Augment Them?". You have 10 minutes. The floor is open.' },
    { speaker: 'Pooja (AI Peer)', role: 'peer', text: 'I would like to initiate by saying that while AI code generation tools are advancing, understanding business logic and domain architecture still requires human engineers.' },
    { speaker: 'Arjun (AI Peer)', role: 'peer', text: 'I agree with Pooja, but we cannot ignore that boilerplate coding is being automated rapidly. Junior engineers will need to learn system design earlier.' },
  ])
  const [myTurn, setMyTurn] = useState('')

  const handleIntervene = () => {
    if (!myTurn.trim()) return
    const text = myTurn.trim()
    setMyTurn('')

    const updated = [...messages, { speaker: 'You (Candidate)', role: 'user', text }]
    setMessages(updated)

    setTimeout(() => {
      setMessages([
        ...updated,
        {
          speaker: 'Moderator Feedback',
          role: 'moderator',
          text: 'Great entry! You acknowledged the previous speaker while adding a fresh technical perspective. In a live GD, maintaining eye contact and steady volume seals this advantage.',
        },
      ])
    }, 1200)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="info">Group Discussion Arena</Badge>
          <span className="text-xs text-sv-text-secondary">Campus Placement GD Practice</span>
        </div>
        <h1 className="text-2xl font-bold text-sv-text mt-1">Group Discussion Simulation</h1>
        <p className="text-sm text-sv-text-secondary">
          Practice entering the conversation politely, backing up arguments, and synthesizing team points.
        </p>
      </div>

      <div className="p-4 bg-sv-surface border border-sv-border rounded-sv shadow-sv-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-sv-text-secondary uppercase">Current Topic:</span>
          <h2 className="text-base font-bold text-sv-text">{topic}</h2>
        </div>
        <div className="flex gap-2">
          {['AI in Jobs', 'EVs in India', 'Hybrid Work'].map(t => (
            <button
              key={t}
              onClick={() => setTopic(t === 'AI in Jobs' ? 'Will AI Replace Junior Software Engineers or Augment Them?' : t === 'EVs in India' ? 'Is India Ready for 100% Electric Vehicles by 2030?' : 'Hybrid Work Model: Boon or Bane for Fresh Graduates?')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-sv-text-secondary hover:bg-gray-200"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Card padding="md" className="space-y-4 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-3 max-h-[460px] overflow-y-auto p-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-sv text-sm ${
                m.role === 'user'
                  ? 'bg-sv-primary text-white ml-8'
                  : m.role === 'moderator'
                  ? 'bg-blue-50 border border-blue-200 text-sv-text'
                  : 'bg-gray-100 text-sv-text mr-8'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1 opacity-80">
                <Users className="h-3.5 w-3.5" />
                <span>{m.speaker}</span>
              </div>
              <p className="leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-sv-border space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={myTurn}
              onChange={e => setMyTurn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleIntervene()}
              placeholder="Politely intervene: 'To build on Arjun\'s point...' or 'I respectfully see another angle...'"
              className="flex-1 px-4 py-2.5 text-sm border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary"
            />
            <Button size="md" onClick={handleIntervene} disabled={!myTurn.trim()}>
              <Send className="h-4 w-4" /> Contribute
            </Button>
          </div>
          <div className="flex justify-between text-xs text-sv-text-secondary">
            <span>Phrases to try: &ldquo;I agree to a large extent, and would add...&rdquo;</span>
            <span>GD Score: Formative</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
