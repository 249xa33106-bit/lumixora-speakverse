'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/speakverse')
        router.refresh()
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = () => {
    setEmail('student@speakverse.dev')
    setPassword('password123')
  }

  return (
    <div className="min-h-screen bg-sv-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/speakverse" className="inline-flex items-center gap-2 font-bold text-2xl text-sv-text">
            <Zap className="h-7 w-7 text-sv-primary" aria-hidden="true" />
            <span>LUMIXORA <span className="text-sv-primary">SpeakVerse</span></span>
          </Link>
          <p className="text-sm text-sv-text-secondary mt-2">
            Master English communication for placements and career growth
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to continue your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-sv-error"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="College or Personal Email"
                type="email"
                placeholder="student@college.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-sv-border space-y-3">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="w-full py-2 px-3 text-xs font-medium bg-blue-50 text-sv-primary rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Prefill Demo Student Credentials
              </button>

              <div className="text-center text-sm text-sv-text-secondary">
                Don&apos;t have an account yet?{' '}
                <Link href="/register" className="font-semibold text-sv-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
