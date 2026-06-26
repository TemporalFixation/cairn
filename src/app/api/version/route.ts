import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readFileSync } from 'fs'
import { join } from 'path'

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
        next: { revalidate: 3600 }, // cache 1h
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

  return NextResponse.json({ currentVersion, latest, updateAvailable, releaseNotes, releaseUrl, githubRepo })
}
