'use client'

import React, { Suspense, useEffect, useState, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'

function SsoBridgeContent() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [statusText, setStatusText] = useState('Authenticating Lumixora Scholar...')
  const attemptedRef = useRef(false)

  const email = (searchParams.get('email') || '').trim().toLowerCase()
  const name = searchParams.get('name') || ''
  const college = searchParams.get('college') || ''
  const target = searchParams.get('target') || '/speakverse/home'
  const SSO_SECRET = 'lumixora_sso_shared_secret_secure_key_2026'

  const navigateToTarget = () => {
    try {
      window.location.replace(target)
    } catch {
      window.location.href = target
    }
  }

  useEffect(() => {
    // 1. If already authenticated with this email, navigate directly to target!
    if (status === 'authenticated' && session?.user?.email?.toLowerCase() === email) {
      navigateToTarget()
      return
    }

    if (!email) {
      navigateToTarget()
      return
    }

    if (attemptedRef.current) return
    attemptedRef.current = true

    const doSso = async () => {
      try {
        setStatusText('Unlocking SpeakVerse Workspace...')
        const res = await signIn('credentials', {
          email,
          name,
          college,
          ssoSecret: SSO_SECRET,
          redirect: false,
          callbackUrl: target,
        })

        if (res?.ok || !res?.error) {
          setStatusText('Workspace Unlocked! Loading...')
        }
        // Force hard navigation so session cookie is attached to all document requests
        setTimeout(navigateToTarget, 300)
      } catch (err) {
        console.warn('SSO silent fallback:', err)
        navigateToTarget()
      }
    }

    doSso()

    // Safety fallback timer: auto redirect if anything delays
    const timer = setTimeout(() => {
      navigateToTarget()
    }, 2000)

    return () => clearTimeout(timer)
  }, [email, name, college, target, status, session])

  return (
    <div className="min-h-screen bg-[#070710] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#070710] flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
      </div>

      <h2 className="text-xl font-black tracking-tight text-white mb-1.5">
        Connecting Lumixora Scholar
      </h2>
      <p className="text-xs text-gray-400 font-mono mb-6 max-w-sm truncate">
        {email || 'Instant Zero-Password Single Sign-On'}
      </p>

      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 font-semibold shadow-inner mb-6">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        <span>{statusText}</span>
      </div>

      <button
        onClick={navigateToTarget}
        className="text-xs text-gray-400 hover:text-white underline flex items-center gap-1.5 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/5"
      >
        <span>Enter SpeakVerse Workspace</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function SsoBridgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070710] flex items-center justify-center text-white">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      }
    >
      <SsoBridgeContent />
    </Suspense>
  )
}
