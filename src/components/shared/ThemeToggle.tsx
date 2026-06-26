'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-4" />

  const dark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-medium"
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {/* Track */}
      <span className={`relative inline-flex w-8 h-4 rounded-full border border-white/20 transition-colors ${dark ? 'bg-white/20' : 'bg-white/10'}`}>
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${dark ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
      <span className="select-none">{dark ? '🌙' : '☀️'}</span>
    </button>
  )
}
