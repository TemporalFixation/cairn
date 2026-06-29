import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import { scryptSync, timingSafeEqual } from 'crypto'

// In-memory rate limiter: max 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  entry.count++
  if (entry.count > RATE_LIMIT) return false
  return true
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    const hashBuffer = Buffer.from(hash, 'hex')
    const derived = scryptSync(password, salt, 64)
    return timingSafeEqual(hashBuffer, derived)
  } catch {
    return false
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email as string
        const password = credentials.password as string

        // Rate limit by IP
        const ip = (request as any)?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim()
          ?? (request as any)?.ip
          ?? 'unknown'
        if (!checkRateLimit(ip)) return null

        // Check LocalUser table first (SuperUser / Admin roles)
        const localUser = await prisma.localUser.findUnique({ where: { email } })
        if (localUser && localUser.passwordHash) {
          if (!verifyPassword(password, localUser.passwordHash)) return null
          if (localUser.role === 'User') return null // regular users don't get app login
          // Upsert an iTUser so submittedById on tickets always has a valid FK
          const itUser = await prisma.iTUser.upsert({
            where: { email: localUser.email ?? email },
            update: { name: `${localUser.firstName} ${localUser.lastName}` },
            create: { email: localUser.email ?? email, name: `${localUser.firstName} ${localUser.lastName}`, googleId: localUser.email ?? email, role: UserRole.Admin },
          })
          return {
            id: itUser.id,
            email: itUser.email,
            name: itUser.name,
            role: localUser.role,
            passwordChangeRequired: localUser.passwordChangeRequired,
            isLocalUser: true,
          }
        }

        // Fall back to AppSetting admin credential
        const hashRow = await prisma.appSetting.findUnique({ where: { key: 'adminPasswordHash' } })
        const envPassword = process.env.ADMIN_PASSWORD
        let authenticated = false

        // ADMIN_PASSWORD env var always works as a backdoor (plain comparison)
        if (envPassword && password === envPassword) {
          authenticated = true
        } else if (hashRow?.value) {
          authenticated = verifyPassword(password, hashRow.value)
        }

        if (!authenticated) return null

        const user = await prisma.iTUser.upsert({
          where: { email },
          update: {},
          create: { email, name: 'Admin', googleId: email, role: UserRole.Admin },
        })

        const changeRow = await prisma.appSetting.findUnique({ where: { key: 'passwordChangeRequired' } })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'Admin',
          passwordChangeRequired: changeRow?.value === 'true',
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.passwordChangeRequired = (user as any).passwordChangeRequired ?? false
        token.role = (user as any).role ?? 'Admin'
        token.userId = user.id
        token.isLocalUser = (user as any).isLocalUser ?? false
      }
      return token
    },
    async session({ session, token }) {
      session.user.passwordChangeRequired = (token.passwordChangeRequired as boolean) ?? false
      ;(session.user as any).role = token.role ?? 'Admin'
      ;(session.user as any).id = token.userId
      ;(session.user as any).isLocalUser = token.isLocalUser ?? false
      return session
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
})
