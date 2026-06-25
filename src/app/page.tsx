'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-500">Total Assets</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.totalAssets}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-500">Open Tickets</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{data.openTickets}</p></CardContent>
        </Card>
        {data.assetsByBuilding.map((b: any) => (
          <Card key={b.building}>
            <CardHeader className="pb-1"><CardTitle className="text-sm text-slate-500">{b.building}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{b.count}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/assets/new"><Button>Add Asset</Button></Link>
        <Link href="/tickets/new"><Button variant="outline">New Repair Ticket</Button></Link>
        <Link href="/assets/import"><Button variant="outline">Import CSV</Button></Link>
      </div>
      <div>
        <h2 className="text-base font-semibold mb-2">Recently Updated Assets</h2>
        <ul className="space-y-1 text-sm">
          {data.recentAssets.map((a: any) => (
            <li key={a.id}>
              <Link href={`/assets/${a.id}`} className="text-blue-600 hover:underline">{a.assetTag}</Link>
              <span className="ml-2 text-slate-500">{a.manufacturer} {a.model} · {a.building}{a.room ? ` / ${a.room.name}` : ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
