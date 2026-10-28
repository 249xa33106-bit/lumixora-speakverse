'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, BookOpen, Mic, Headphones, Users, Trophy,
  BarChart3, Settings, Menu, X, Zap, GraduationCap, LogOut, Cuboid, Globe
} from 'lucide-react'
import { toast } from 'sonner'

const navigation = [
  { href: '/speakverse/home', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/speakverse/classroom', label: '3D Classroom', icon: Cuboid },
  { href: '/speakverse/learn', label: 'Learn', icon: BookOpen },
  { href: '/speakverse/speak', label: 'Speak Studio', icon: Mic },
  { href: '/speakverse/listening', label: 'Listening Lab', icon: Headphones },
  { href: '/speakverse/interview', label: 'Interview Arena', icon: GraduationCap },
  { href: '/speakverse/group-discussion', label: 'Group Discussion', icon: Users },
  { href: '/speakverse/progress', label: 'My Progress', icon: BarChart3 },
  { href: '/speakverse/achievements', label: 'Achievements', icon: Trophy },
  { href: '/speakverse/settings', label: 'Settings', icon: Settings },
]

export function SpeakVerseShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [teluguEnabled, setTeluguEnabled] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    fetch('/api/speakverse/v1/profile')
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p?.explanationLanguage === 'te_en') {
          setTeluguEnabled(true)
        }
      })
      .catch(() => {})
  }, [])

  const toggleLanguage = async () => {
    const next = !teluguEnabled
    setTeluguEnabled(next)
    try {
      await fetch('/api/speakverse/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explanationLanguage: next ? 'te_en' : 'en' }),
      })
      toast.success(next ? 'Telugu support enabled (తెలుగు వివరణలు ఆన్)' : 'Switched to English only')
    } catch {}
  }

  return (
    <div className="min-h-screen bg-sv-bg flex flex-col">
      {/* Top nav - LUMIXORA brand bar */}
      <header className="bg-sv-surface border-b border-sv-border h-14 flex items-center px-4 z-30 sticky top-0">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary"
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/speakverse" className="flex items-center gap-2 font-bold text-sv-text">
            <Zap className="h-5 w-5 text-sv-primary" aria-hidden="true" />
            <span className="hidden sm:inline">LUMIXORA</span>
          </Link>
          <span className="text-sv-border hidden sm:inline">›</span>
          <Link href="/speakverse/home" className="text-sv-primary font-semibold text-sm hidden sm:inline">
            SpeakVerse
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Mode Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
              teluguEnabled
                ? "bg-teal-50 border-teal-300 text-sv-accent shadow-xs"
                : "bg-gray-50 border-sv-border text-sv-text-secondary hover:bg-gray-100"
            )}
            title="Toggle English + Telugu explanations"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{teluguEnabled ? "EN + తెలుగు" : "English"}</span>
          </button>

          {session?.user?.name && (
            <span className="text-sm text-sv-text-secondary hidden md:inline">
              {session.user.name}
            </span>
          )}
          <div
            className="h-8 w-8 rounded-full bg-sv-primary text-white flex items-center justify-center text-sm font-semibold"
            aria-hidden="true"
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? 'S'}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sv-text-secondary hover:text-sv-error p-1.5 rounded-lg hover:bg-gray-100"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <nav
          className={clsx(
            'fixed lg:static inset-y-0 left-0 top-14 z-20 w-60 bg-sv-surface border-r border-sv-border',
            'flex flex-col pt-4 pb-6 overflow-y-auto',
            'transition-transform duration-200 lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="SpeakVerse navigation"
        >
          <ul role="list" className="space-y-1 px-3 flex-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary',
                      active
                        ? 'bg-blue-50 text-sv-primary font-semibold'
                        : 'text-sv-text-secondary hover:bg-gray-100 hover:text-sv-text'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
