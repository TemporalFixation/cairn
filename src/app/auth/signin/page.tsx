'use client'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const params = useSearchParams()
  const error = params.get('error')
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">K-12 Inventory</h1>
        {error === 'unauthorized' && (
          <p className="text-red-500 text-sm">Your account is not authorized to access this app.</p>
        )}
        <Button onClick={() => signIn('google', { callbackUrl: '/' })}>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
