import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mic, BookOpen, BarChart3, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react'

export default async function SpeakVerseLanding() {
  const session = await auth()
  if (session?.user?.id) {
    const profile = await prisma.svProfile.findUnique({
      where: { userId: session.user.id },
    })
    if (profile?.onboardingComplete) {
      redirect('/speakverse/home')
    } else {
      redirect('/speakverse/onboarding')
    }
  }

  return (
    <main className="min-h-screen bg-sv-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-sv-primary to-blue-800 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Speak English with confidence.<br />Prepare for your future.
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            AI-powered English learning designed for Indian college students.
            From everyday fluency to placement interviews — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-sv-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sv-primary min-h-[52px]"
            >
              Start My Learning Journey <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[52px]"
            >
              Continue Learning
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-6" aria-label="Key features">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-sv-text text-center mb-12">
            Everything you need to communicate with confidence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Mic,
                title: 'AI Speaking Coach',
                desc: 'Practice conversations, get instant feedback, and improve one session at a time.',
                color: 'text-sv-primary',
                bg: 'bg-blue-50',
              },
              {
                icon: BookOpen,
                title: 'Personalized Learning Path',
                desc: 'Start with an assessment and follow a path built around your skills and goals.',
                color: 'text-sv-accent',
                bg: 'bg-teal-50',
              },
              {
                icon: GraduationCap,
                title: 'Mock Interviews',
                desc: 'Practice HR, technical, and behavioral interviews with structured feedback.',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                icon: BarChart3,
                title: 'Progress Analytics',
                desc: "See exactly where you've improved and what to focus on next.",
                color: 'text-sv-warning',
                bg: 'bg-amber-50',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-sv-surface rounded-sv border border-sv-border p-6 shadow-sv-card">
                <div className={`inline-flex p-3 rounded-xl ${bg} mb-4`}>
                  <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-sv-text mb-2">{title}</h3>
                <p className="text-sm text-sv-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Lesson Preview */}
      <section className="py-16 px-6 bg-sv-surface border-y border-sv-border" aria-label="Sample lesson preview">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-sv-text text-center mb-8">Try a sample lesson</h2>
          <div className="bg-sv-bg rounded-sv-lg border border-sv-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-sv-primary">Grammar</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-sv-text-secondary">A1 · 5 min</span>
            </div>
            <h3 className="text-lg font-semibold text-sv-text mb-2">Arrange the words into a correct sentence</h3>
            <p className="text-sm text-sv-text-secondary mb-6">Drag or click the words in the correct order.</p>
            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Word tiles">
              {['engineering', 'I', 'studying', 'am'].map(word => (
                <button
                  key={word}
                  className="px-4 py-2 bg-white border-2 border-sv-border rounded-lg text-sv-text font-medium hover:border-sv-primary hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary min-h-[44px]"
                >
                  {word}
                </button>
              ))}
            </div>
            <p className="text-xs text-sv-text-secondary flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-sv-success"></span>
              Sign in to submit answers and save your progress
            </p>
          </div>
        </div>
      </section>

      {/* Privacy note */}
      <section className="py-12 px-6" aria-label="Privacy information">
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-sv p-6">
            <h2 className="font-semibold text-sv-text mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-sv-success" aria-hidden="true" />
              Your privacy matters
            </h2>
            <ul className="text-sm text-sv-text-secondary space-y-2">
              <li>• Microphone access is only requested when you start a voice activity — never automatically.</li>
              <li>• You can practise every lesson using text — voice is always optional.</li>
              <li>• AI feedback is clearly labeled as a learning tool, not a verified proficiency score.</li>
              <li>• You can export or delete your data at any time from Settings.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-sv-border text-center text-sm text-sv-text-secondary">
        <p>© 2026 LUMIXORA SpeakVerse · <Link href="/login" className="underline hover:text-sv-text">Sign In</Link></p>
      </footer>
    </main>
  )
}
