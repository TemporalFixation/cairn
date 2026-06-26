'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { AssetWithRelations, TicketWithRelations } from '@/types'

type AssetEvent = {
  id: string
  eventType: string
  person: string | null
  accessories: string[]
  missingAccessories: string[]
  performedBy: string | null
  notes: string | null
  createdAt: string
}

const EVENT_STYLES: Record<string, { label: string; dot: string; bg: string }> = {
  CheckOut: { label: 'Checked Out', dot: 'bg-red-500',   bg: 'border-red-500/20 bg-red-500/5' },
  CheckIn:  { label: 'Checked In',  dot: 'bg-green-500', bg: 'border-green-500/20 bg-green-500/5' },
  Enrolled: { label: 'Enrolled',    dot: 'bg-blue-500',  bg: 'border-blue-500/20 bg-blue-500/5' },
}

const CONDITION_STYLES: Record<string, string> = {
  New:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Good: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [asset, setAsset] = useState<(AssetWithRelations & { repairTickets: TicketWithRelations[]; events: AssetEvent[] }) | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => setAsset(d.asset))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/assets/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: deleteReason || null }),
    })
    router.push('/assets')
  }

  if (!asset) return <p className="p-8 text-muted-foreground">Loading…</p>

  const person = asset.assignedToPerson as any
  const events: AssetEvent[] = (asset as any).events ?? []
  const isOut = !!person

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Asset</p>
          <h1 className="text-3xl font-bold tracking-tight">{asset.manufacturer} {asset.model}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{asset.assetTag}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CONDITION_STYLES[asset.condition] ?? ''}`}>{asset.condition}</span>
            {isOut
              ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Checked Out</span>
              : <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Available</span>
            }
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/tickets/new?assetId=${asset.id}`}>
            <Button variant="outline" size="sm">New Ticket</Button>
          </Link>
          <Link href={`/assets/${asset.id}/edit`}>
            <Button size="sm">Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Device Info */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold tracking-wide">Device Info</h2>
          </div>
          <dl className="divide-y divide-border">
            <Row label="Manufacturer">{asset.manufacturer}</Row>
            <Row label="Model">{asset.model}</Row>
            <Row label="Asset Tag"><span className="font-mono">{asset.assetTag}</span></Row>
            <Row label="Serial #"><span className="font-mono">{asset.serialNumber}</span></Row>
            <Row label="Condition">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CONDITION_STYLES[asset.condition] ?? ''}`}>{asset.condition}</span>
            </Row>
            <Row label="Building">{asset.building}{asset.room ? ` · ${asset.room.name}` : ''}</Row>
            {asset.fundingSource && <Row label="Funding">{asset.fundingSource}</Row>}
            {asset.warrantyExpiration && <Row label="Warranty exp.">{new Date(asset.warrantyExpiration).toLocaleDateString()}</Row>}
            {asset.purchaseDate && <Row label="Purchased">{new Date(asset.purchaseDate).toLocaleDateString()}</Row>}
            {(asset as any).secondaryTags?.length > 0 && (
              <Row label="Alt. tags"><span className="font-mono text-xs">{(asset as any).secondaryTags.join(', ')}</span></Row>
            )}
            {asset.notes && <Row label="Notes">{asset.notes}</Row>}
          </dl>
        </section>

        {/* Assignment status */}
        <section className="space-y-5">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold tracking-wide">Current Assignment</h2>
            </div>
            {isOut ? (
              <dl className="divide-y divide-border">
                <Row label="Assigned to"><span className="font-medium">{person.name}</span></Row>
                {person.email && <Row label="Email">{person.email}</Row>}
                {(asset as any).checkedOutAt && (
                  <Row label="Checked out">{new Date((asset as any).checkedOutAt).toLocaleString()}</Row>
                )}
                {(asset as any).providedAccessories?.length > 0 && (
                  <Row label="Accessories">{(asset as any).providedAccessories.join(', ')}</Row>
                )}
              </dl>
            ) : (
              <div className="px-5 py-6 text-sm text-muted-foreground">Device is available — not assigned to anyone.</div>
            )}
          </div>

          {/* Repair tickets */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide">Repair Tickets</h2>
              {asset.repairTickets.length > 0 && (
                <span className="text-xs font-mono text-muted-foreground">{asset.repairTickets.length} ticket{asset.repairTickets.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {asset.repairTickets.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">No repair tickets.</div>
            ) : (
              <ul className="divide-y divide-border">
                {asset.repairTickets.map((t: any) => (
                  <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/tickets/${t.id}`} className="text-sm font-medium hover:underline">{t.issueType}</Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${
                      t.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      t.status === 'Resolved' || t.status === 'Closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>{t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Assignment History */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide">Assignment History</h2>
          {events.length > 0 && <span className="text-xs font-mono text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''}</span>}
        </div>
        <div className="px-5 py-5">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div>
              {events.map((ev, i) => {
                const style = EVENT_STYLES[ev.eventType] ?? { label: ev.eventType, dot: 'bg-muted-foreground', bg: 'border-border bg-muted/20' }
                return (
                  <div key={ev.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-[14px] shrink-0 ${style.dot}`} />
                      {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1.5" />}
                    </div>
                    <div className={`mb-4 flex-1 rounded-lg border px-4 py-3 text-sm ${style.bg}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold">{style.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ev.createdAt).toLocaleString()}
                          {ev.performedBy ? ` · by ${ev.performedBy}` : ''}
                        </span>
                      </div>
                      {ev.person && (
                        <p className="mt-1.5 text-muted-foreground">
                          {ev.eventType === 'CheckOut' ? 'Assigned to' : 'Returned by'}:{' '}
                          <span className="text-foreground font-medium">{ev.person}</span>
                        </p>
                      )}
                      {ev.accessories.length > 0 && (
                        <p className="mt-1 text-muted-foreground">
                          {ev.eventType === 'CheckOut' ? 'Provided' : 'Returned'}:{' '}
                          <span className="text-foreground">{ev.accessories.join(', ')}</span>
                        </p>
                      )}
                      {ev.missingAccessories.length > 0 && (
                        <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                          Missing on return: {ev.missingAccessories.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-semibold text-base">Delete Asset</h2>
            <p className="text-sm text-muted-foreground">
              This removes <span className="font-medium text-foreground">{asset.assetTag}</span> from active inventory.
              All history, tickets, and events are preserved in the Deleted Assets report.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Reason (optional)</label>
              <input
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary"
                placeholder="e.g. Retired, Lost, Stolen, Damaged beyond repair"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete Asset'}
              </button>
              <button onClick={() => setShowDelete(false)}
                className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3">
      <dt className="text-xs font-medium text-muted-foreground w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm flex-1">{children}</dd>
    </div>
  )
}
