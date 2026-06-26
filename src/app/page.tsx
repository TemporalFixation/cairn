'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-8">
      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Loading…
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">
          Overview
        </p>
        <h1 className="text-2xl font-semibold">Asset Dashboard</h1>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Assets"
          value={data.totalAssets}
          accent="navy"
        />
        <StatCard
          label="Open Tickets"
          value={data.openTickets}
          accent={data.openTickets > 0 ? 'amber' : 'green'}
        />
        {data.assetsByBuilding.map((b: any) => (
          <StatCard key={b.building} label={b.building} value={b.count} accent="slate" />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <ActionButton href="/assets/new" primary>+ Add Asset</ActionButton>
        <ActionButton href="/tickets/new">+ New Ticket</ActionButton>
        <ActionButton href="/assets/import">↑ Import CSV</ActionButton>
      </div>

      {/* Recent assets */}
      {data.recentAssets?.length > 0 && (
        <div>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-3">
            Recently Updated
          </p>
          <div className="bg-card rounded-md border divide-y">
            {data.recentAssets.map((a: any) => (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors">
                <span
                  className="font-mono text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {a.assetTag}
                </span>
                <span className="text-sm text-foreground">{a.manufacturer} {a.model}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {a.building}{a.room ? ` · ${a.room.name}` : ''}
                </span>
                <Link
                  href={`/assets/${a.id}`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  const accentStyles: Record<string, { border: string; value: string }> = {
    navy:  { border: 'border-l-primary',   value: 'text-primary' },
    amber: { border: 'border-l-amber-500', value: 'text-amber-600' },
    green: { border: 'border-l-emerald-600', value: 'text-emerald-700' },
    slate: { border: 'border-l-slate-400', value: 'text-slate-700' },
  }
  const s = accentStyles[accent] ?? accentStyles.slate
  return (
    <div className={`bg-card rounded-md border border-l-4 ${s.border} p-4 space-y-1`}>
      <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${s.value}`}>{value}</p>
    </div>
  )
}

function ActionButton({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90'
          : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border bg-card hover:bg-secondary transition-colors'
      }
      style={primary ? { backgroundColor: 'var(--navy)' } : undefined}
    >
      {children}
    </Link>
  )
}
