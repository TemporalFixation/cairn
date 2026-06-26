import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Edge-compatible config — no Prisma adapter, used only in middleware
export const authConfig: NextAuthConfig = {
  providers: [Credentials({})],
  pages: { signIn: '/auth/signin', error: '/auth/signin' },
  callbacks: {
    authorized({ auth }) {
      return !!auth
    },
  },
}
