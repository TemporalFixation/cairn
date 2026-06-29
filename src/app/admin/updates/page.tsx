'use client'
import { useState, useEffect, useRef } from 'react'

type VersionInfo = {
  currentVersion: string
  latest: string | null
  updateAvailable: boolean
  releaseNotes: string
  releaseUrl: string
  githubRepo: string | null
  webhookConfigured: boolean
}

export default function UpdatesPage() {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [log, setLog] = useState<string | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  async function load() {
    setChecking(true)
    const r = await fetch('/api/version')
    const d = await r.json()
    setInfo(d)
    setLoading(false)
    setChecking(false)
  }

  useEffect(() => { load() }, [])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  async function runUpdate() {
    setUpdating(true)
    setLog('')
    const res = await fetch('/api/admin/update', { method: 'POST' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setLog(`Error: ${d.error ?? res.statusText}`)
      setUpdating(false)
      return
    }
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) { setUpdating(false); return }
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setLog(prev => (prev ?? '') + decoder.decode(value, { stream: true }))
    }
    setUpdating(false)
    // Reload version info after update completes
    setTimeout(load, 2000)
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Checking version…</div>
  if (!info) return null

  const { currentVersion, latest, updateAvailable, releaseNotes, releaseUrl, githubRepo, webhookConfigured } = info

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Updates</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Check for new Cairn releases and apply updates.</p>
      </div>

      {/* Current version + update status */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Current Version</p>
            <p className="text-2xl font-bold font-mono mt-0.5">v{currentVersion}</p>
          </div>
          <button onClick={load} disabled={checking || updating}
            className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent disabled:opacity-50">
            {checking ? 'Checking…' : '↻ Check Now'}
          </button>
        </div>

        {!githubRepo ? (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <p className="font-semibold">GitHub repo not configured</p>
            <p className="text-xs mt-0.5">Set <span className="font-mono">GITHUB_REPO=TemporalFixation/cairn</span> in your <span className="font-mono">.env</span> to enable update checking.</p>
          </div>
        ) : updateAvailable ? (
          <div className="rounded-md bg-green-500/10 border border-green-500/30 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-green-600 dark:text-green-400 font-semibold text-sm">Update available: v{latest}</p>
                {releaseUrl && (
                  <a href={releaseUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline">View release notes on GitHub →</a>
                )}
              </div>
              {webhookConfigured ? (
                <button onClick={runUpdate} disabled={updating}
                  className="px-5 py-2 rounded-md font-semibold text-sm text-white disabled:opacity-60 transition-colors"
                  style={{ backgroundColor: updating ? '#555' : '#1A6B45' }}>
                  {updating ? 'Updating…' : '↑ Update Now'}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground italic">One-click update not configured</span>
              )}
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

        {/* One-click update available even when already up to date */}
        {!updateAvailable && webhookConfigured && githubRepo && (
          <div className="flex items-center gap-3 pt-1">
            <button onClick={runUpdate} disabled={updating}
              className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent disabled:opacity-50">
              {updating ? 'Running update…' : '↑ Force Re-deploy'}
            </button>
            <span className="text-xs text-muted-foreground">Pull latest code and rebuild even if already up to date.</span>
          </div>
        )}
      </div>

      {/* Live update log */}
      {log !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Update Log</p>
            {!updating && (
              <button onClick={() => setLog(null)} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            )}
          </div>
          <pre ref={logRef}
            className="bg-black text-green-400 text-xs rounded-lg px-4 py-4 overflow-y-auto font-mono whitespace-pre-wrap"
            style={{ maxHeight: '400px' }}>
            {log || (updating ? 'Connecting…' : '')}
            {updating && <span className="animate-pulse">█</span>}
          </pre>
        </div>
      )}

      {/* One-click not configured warning */}
      {!webhookConfigured && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 space-y-2">
          <p className="text-sm font-semibold">One-Click Update Not Available</p>
          <p className="text-xs text-muted-foreground">
            The <span className="font-mono">cairn-update</span> service is not running on this host.
            Run <span className="font-mono">install.sh</span> on the server to enable it, or update manually:
          </p>
          <pre className="bg-black/80 text-green-400 text-xs rounded-md px-4 py-3 overflow-x-auto font-mono">
{`cd /opt/cairn && ./update.sh`}
          </pre>
        </div>
      )}

      {/* How to update manually */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Manual Update</h2>
        <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4 text-sm">
          <p>SSH into your server and run:</p>
          <pre className="bg-black/80 text-green-400 text-xs rounded-md px-4 py-3 overflow-x-auto font-mono">
{`cd /opt/cairn
./update.sh`}
          </pre>
          <p className="text-muted-foreground text-xs">
            Pulls latest code from GitHub, rebuilds the Docker image, and restarts the service.
            Your database is never touched — only application code updates.
          </p>
        </div>
      </div>

      {/* Data safety */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Data Safety</h2>
        <div className="rounded-lg border border-border p-5 text-sm space-y-2 text-muted-foreground">
          <p>Cairn uses <strong className="text-foreground">Prisma Migrate</strong> for database changes. Every schema change is recorded as a migration file that only runs once and only adds — never drops — tables or columns.</p>
          <p>The update script automatically creates a timestamped backup before pulling new code. To create a manual backup:</p>
          <pre className="bg-black/80 text-green-400 text-xs rounded-md px-4 py-3 overflow-x-auto font-mono">
{`docker exec cairn-db-1 \\
  pg_dump -U k12user k12inventory > backup.sql`}
          </pre>
        </div>
      </div>

      {/* Maintenance tools */}
      <BackfillLookupsButton />

      {/* Release workflow */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Release Workflow</h2>
        <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground space-y-1">
          <p>New releases are published to GitHub with a version tag (<span className="font-mono">v1.2.3</span>). When you run <span className="font-mono">./update.sh</span>, the latest tag is pulled automatically.</p>
          <p className="mt-2">See the full changelog at <a href="https://github.com/TemporalFixation/cairn" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">github.com/TemporalFixation/cairn</a>.</p>
        </div>
      </div>
    </div>
  )
}

function BackfillLookupsButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    setStatus(null)
    const r = await fetch('/api/admin/backfill-lookups', { method: 'POST' })
    const d = await r.json()
    if (r.ok) setStatus(`Done — synced ${d.assets} assets, registered ${d.lookups} lookup entries.`)
    else setStatus(`Error: ${d.error}`)
    setRunning(false)
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Maintenance</h2>
      <div className="rounded-lg border border-border p-5 space-y-3">
        <div>
          <p className="text-sm font-medium">Sync Manufacturer &amp; Model Lookups</p>
          <p className="text-xs text-muted-foreground mt-0.5">Registers all manufacturers and models from existing assets into the lookup tables. Run this once after a CSV import to fix dropdowns showing &quot;Other&quot;.</p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {running ? 'Running…' : 'Sync Lookups'}
        </button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </div>
  )
}
