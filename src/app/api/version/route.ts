import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Read version from package.json at runtime
  let currentVersion = '0.0.0'
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    currentVersion = pkg.version
  } catch {}

  const githubRepo = process.env.GITHUB_REPO // e.g. "kristoferfriers/k12-inventory"
  let latest = null
  let releaseNotes = ''
  let releaseUrl = ''
  let updateAvailable = false

  if (githubRepo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
        headers: { 'User-Agent': 'k12-inventory-app', Accept: 'application/vnd.github.v3+json' },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        latest = data.tag_name?.replace(/^v/, '') ?? null
        releaseNotes = data.body ?? ''
        releaseUrl = data.html_url ?? ''
        if (latest && latest !== currentVersion) updateAvailable = true
      }
    } catch {}
  }

  // Check if the host webhook is reachable
  const webhookPort = process.env.WEBHOOK_PORT ?? '9191'
  const webhookSecret = process.env.WEBHOOK_SECRET ?? ''
  let webhookConfigured = false
  if (webhookSecret) {
    try {
      const health = await fetch(`http://host.docker.internal:${webhookPort}/health`, {
        signal: AbortSignal.timeout(2000),
      })
      webhookConfigured = health.ok
    } catch {}
  }

  return NextResponse.json({ currentVersion, latest, updateAvailable, releaseNotes, releaseUrl, githubRepo, webhookConfigured })
}
