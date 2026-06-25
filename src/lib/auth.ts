import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

async function isInAllowedGroup(accessToken: string, email: string): Promise<boolean> {
  const group = process.env.ALLOWED_GOOGLE_GROUP
  if (!group) return true // no restriction configured — allow all (dev mode)
  try {
    const res = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(group)}/hasMember/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return data.isMember === true
  } catch {
    return false
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/admin.directory.group.member.readonly',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) return false
      const allowed = await isInAllowedGroup(account?.access_token ?? '', profile.email)
      if (!allowed) return '/auth/signin?error=unauthorized'

      // Upsert ITUser on first sign-in
      await prisma.iTUser.upsert({
        where: { email: profile.email },
        update: { name: profile.name ?? profile.email },
        create: {
          email: profile.email,
          name: profile.name ?? profile.email,
          googleId: profile.sub ?? profile.email,
          role: UserRole.Technician,
        },
      })
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.iTUser.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true },
        })
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
        }
      }
      return session
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
})
