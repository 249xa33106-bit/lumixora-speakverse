import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const LUMIXORA_SSO_SECRET = process.env.LUMIXORA_SSO_SECRET || 'lumixora_sso_shared_secret_secure_key_2026'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: 'none',
        secure: true,
        path: '/',
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        ssoSecret: { label: 'SSO Secret', type: 'password' },
        name: { label: 'Name', type: 'text' },
        college: { label: 'College', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const cleanEmail = String(credentials.email).trim().toLowerCase()
        const ssoSecret = credentials.ssoSecret ? String(credentials.ssoSecret).trim() : ''

        // 1. LUMIXORA SEAMLESS SINGLE SIGN-ON (Zero Password Required)
        if (ssoSecret === LUMIXORA_SSO_SECRET) {
          const cleanName = credentials.name ? String(credentials.name).trim() : cleanEmail.split('@')[0]
          const collegeName = credentials.college ? String(credentials.college).trim() : 'G. Pulla Reddy Engineering College (GPREC)'
          const isFounder = cleanEmail === 'founder@lumixora.com' || cleanEmail.includes('founder') || cleanEmail === '249xa33106@gprec.ac.in'
          const assignedRole = isFounder ? 'admin' : 'student'

          let user = await prisma.user.findUnique({
            where: { email: cleanEmail },
            include: { svProfile: true },
          })

          if (!user) {
            const dummyHashed = await bcrypt.hash('lumixora_sso_auto_managed_pass', 10)
            user = await prisma.user.create({
              data: {
                email: cleanEmail,
                name: cleanName,
                password: dummyHashed,
                role: assignedRole,
                svProfile: {
                  create: {
                    displayName: cleanName,
                    college: collegeName,
                    degree: 'B.Tech',
                    targetRole: 'Software Development Engineer',
                    learningGoal: 'interview',
                    explanationLanguage: 'te_en',
                    dailyGoalMinutes: 10,
                    onboardingComplete: true,
                    assessmentComplete: true,
                    selfAssessedLevel: 'B1',
                  },
                },
                svRoles: {
                  create: {
                    role: isFounder ? 'administrator' : 'student',
                  },
                },
              },
              include: { svProfile: true },
            })
          } else if (!user.svProfile) {
            await prisma.svProfile.create({
              data: {
                userId: user.id,
                displayName: cleanName,
                college: collegeName,
                degree: 'B.Tech',
                targetRole: 'Software Development Engineer',
                learningGoal: 'interview',
                explanationLanguage: 'te_en',
                dailyGoalMinutes: 10,
                onboardingComplete: true,
                assessmentComplete: true,
                selfAssessedLevel: 'B1',
              },
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || cleanName,
            role: user.role || assignedRole,
          }
        }

        // 2. Standard Manual Password Login
        const parsed = loginSchema.safeParse({ email: cleanEmail, password: credentials.password })
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        ;(token as any).role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = (token as any).role
      }
      return session
    },
  },
})
