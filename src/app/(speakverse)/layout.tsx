import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { SpeakVerseShell } from '@/components/layout/speakverse-shell'

export default async function SpeakVerseLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return <SpeakVerseShell>{children}</SpeakVerseShell>
}
