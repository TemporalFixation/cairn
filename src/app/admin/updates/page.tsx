'use client'
import { useState, useEffect } from 'react'

type VersionInfo = {
  currentVersion: string
  latest: string | null
  updateAvailable: boolean
  releaseNotes: string
  releaseUrl: string
  githubRepo: string | null
}

export default function UpdatesPage() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  async function load() {
    setChecking(true)
    const r = await fetch('/api/version')
    const d = await r.json()
    setInfo(d)
    setLoading(false)
    setChecking(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Checking version…</div>
  if (!info) return null

  const { currentVersion, latest, updateAvailable, releaseNotes, releaseUrl, githubRepo } = info

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Updates</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Check for new releases and apply updates.</p>
      </div>

      {/* Current version */}
      <div className="rounded-lg border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Current Version</p>
            <p className="text-2xl font-bold font-mono mt-0.5">v{currentVersion}</p>
          </div>
          <button onClick={load} disabled={checking}
            className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent disabled:opacity-50">
            {checking ? 'Checking…' : '↻ Check Now'}
          </button>
        </div>

        {!githubRepo ? (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <p className="font-semibold">GitHub repo not configured</p>
            <p className="text-xs mt-0.5">Set <span className="font-mono">GITHUB_REPO=owner/repo</span> in your <span className="font-mono">.env</span> to enable update checking.</p>
          </div>
        ) : updateAvailable ? (
          <div className="rounded-md bg-green-500/10 border border-green-500/30 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">Update available: v{latest}</span>
              {releaseUrl && <a href={releaseUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">View release →</a>}
            </div>
            {releaseNotes && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Release notes</summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans leading-relaxed">{releaseNotes}</pre>
              </details>
            )}
          </div>
        ) : (
          <div className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-green-600">✓</span> You&apos;re on the latest version{latest ? ` (v${latest})` : ''}.
          </div>
        )}
      </div>

      {/* How to update */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">How to Update</h2>
        <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4 text-sm">
          <p>SSH into your server and run the update script:</p>
          <pre className="bg-black/80 text-green-400 text-xs rounded-md px-4 py-3 overflow-x-auto font-mono">
{`cd /path/to/k12-inventory
./update.sh`}
          </pre>
          <p className="text-muted-foreground text-xs">
            This pulls the latest code from GitHub, rebuilds the Docker image, and restarts the service.
            Your data is never touched — only the application code updates.
          </p>
        </div>
      </div>

      {/* Schema safety note */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Data Safety</h2>
        <div className="rounded-lg border border-border p-5 text-sm space-y-2 text-muted-foreground">
          <p>K-12 Inventory uses <strong className="text-foreground">Prisma Migrate</strong> for database changes. Every update to the database schema is recorded as a migration file that only runs once and only adds — never drops — tables or columns unless explicitly specified.</p>
          <p>Before any update, your data directory (<span className="font-mono">pgdata</span> Docker volume) is untouched. To create a manual backup:</p>
          <pre className="bg-black/80 text-green-400 text-xs rounded-md px-4 py-3 overflow-x-auto font-mono">
{`docker exec k12-inventory-db-1 \\
  pg_dump -U k12user k12inventory > backup.sql`}
          </pre>
        </div>
      </div>

      {/* Version history */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Release Workflow</h2>
        <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground space-y-1">
          <p>New releases are published to GitHub with a version tag (<span className="font-mono">v1.2.3</span>). When you run <span className="font-mono">./update.sh</span>, the latest tag is pulled automatically.</p>
          <p className="mt-2">See the full changelog at <span className="font-mono">CHANGELOG.md</span> in the repository.</p>
        </div>
      </div>
    </div>
  )
}
