import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuthed = !!req.auth
  const { pathname } = req.nextUrl
  const isAuthPage = pathname.startsWith('/auth')
  const isApiAuth = pathname.startsWith('/api/auth')
  const isKiosk = pathname.startsWith('/kiosk')

  if (!isAuthed && !isAuthPage && !isApiAuth && !isKiosk) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Force password change on first login
  const mustChange = (req.auth?.user as any)?.passwordChangeRequired
  if (mustChange && !isAuthPage && !isApiAuth) {
    return NextResponse.redirect(new URL('/auth/change-password', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
