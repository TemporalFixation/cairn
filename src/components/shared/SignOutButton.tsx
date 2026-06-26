'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-white/60 hover:text-white text-xs font-medium tracking-wide transition-colors py-1 px-2 rounded"
    >
      Sign out
    </button>
  )
}
