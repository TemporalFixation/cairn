import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import { scryptSync, timingSafeEqual } from 'crypto'

function verifyPassword(password: string, stored: string): boolean {
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
      async authorize(credentials) {
        if (!credentials?.password) return null

        const hashRow = await prisma.appSetting.findUnique({ where: { key: 'adminPasswordHash' } })
        const envPassword = process.env.ADMIN_PASSWORD
        let authenticated = false

        if (hashRow?.value) {
          authenticated = verifyPassword(credentials.password as string, hashRow.value)
        } else if (envPassword) {
          authenticated = credentials.password === envPassword
        }

        if (!authenticated) return null

        const email = (credentials.email as string) || 'admin@k12.local'
        const user = await prisma.iTUser.upsert({
          where: { email },
          update: {},
          create: { email, name: 'Admin', googleId: email, role: UserRole.Admin },
        })

        const changeRow = await prisma.appSetting.findUnique({ where: { key: 'passwordChangeRequired' } })
        return { id: user.id, email: user.email, name: user.name, passwordChangeRequired: changeRow?.value === 'true' }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.passwordChangeRequired = (user as any).passwordChangeRequired ?? false
      return token
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.iTUser.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true },
        })
        if (dbUser) { session.user.id = dbUser.id; session.user.role = dbUser.role }
      }
      session.user.passwordChangeRequired = (token.passwordChangeRequired as boolean) ?? false
      return session
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
})
