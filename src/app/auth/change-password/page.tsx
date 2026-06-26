'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    const r = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, confirmPassword: confirm }),
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error ?? 'Failed'); setLoading(false); return }

    // Re-sign in to get a fresh JWT without passwordChangeRequired
    await signIn('credentials', { email: 'admin@k12.local', password, callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="text-3xl mb-3">🔐</div>
          <h1 className="text-xl font-bold">Set Your Password</h1>
          <p className="text-muted-foreground text-sm">
            This is your first login. Please set a permanent password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium block">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary"
              placeholder="Min. 8 characters"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium block">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary"
              placeholder="Repeat password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Setting password…' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
