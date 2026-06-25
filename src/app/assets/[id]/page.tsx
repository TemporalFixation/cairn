'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssetWithRelations, TicketWithRelations } from '@/types'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [asset, setAsset] = useState<(AssetWithRelations & { repairTickets: TicketWithRelations[] }) | null>(null)

  useEffect(() => {
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => setAsset(d.asset))
  }, [id])

  if (!asset) return <p>Loading...</p>

  const person = asset.assignedToPerson as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{asset.manufacturer} {asset.model}</h1>
        <div className="flex gap-2">
          <Link href={`/tickets/new?assetId=${asset.id}`}>
            <Button variant="outline">New Repair Ticket</Button>
          </Link>
          <Link href={`/assets/${asset.id}/edit`}>
            <Button>Edit</Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Device Info</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-slate-500">Asset Tag:</span> {asset.assetTag}</p>
            <p><span className="text-slate-500">Serial:</span> <span className="font-mono">{asset.serialNumber}</span></p>
            <p><span className="text-slate-500">Condition:</span> <Badge>{asset.condition}</Badge></p>
            <p><span className="text-slate-500">Building:</span> {asset.building}{asset.room ? ` / ${asset.room.name}` : ''}</p>
            {person && <p><span className="text-slate-500">Assigned to:</span> {person.name} ({person.ou})</p>}
            {asset.fundingSource && <p><span className="text-slate-500">Funding:</span> {asset.fundingSource}</p>}
            {asset.warrantyExpiration && <p><span className="text-slate-500">Warranty:</span> {new Date(asset.warrantyExpiration).toLocaleDateString()}</p>}
            {asset.notes && <p><span className="text-slate-500">Notes:</span> {asset.notes}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Repair History</CardTitle></CardHeader>
          <CardContent>
            {asset.repairTickets.length === 0 ? (
              <p className="text-sm text-slate-500">No tickets</p>
            ) : (
              <ul className="text-sm space-y-2">
                {asset.repairTickets.map((t: any) => (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`} className="text-blue-600 hover:underline">{t.issueType}</Link>
                    <span className="ml-2 text-slate-500">{t.status} · {new Date(t.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
