'use client'
import { useEffect, useState } from 'react'
import { TicketTable } from '@/components/tickets/TicketTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { TicketWithRelations } from '@/types'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
]
const BUILDINGS = ['', 'LPQ', 'MHS', 'BG', 'CC']

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [status, setStatus] = useState('')
  const [building, setBuilding] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (building) params.set('building', building)
    fetch(`/api/tickets?${params}`).then(r => r.json()).then(d => setTickets(d.tickets ?? []))
  }, [status, building])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Repair Tickets</h1>
        <Link href="/tickets/new"><Button>New Ticket</Button></Link>
      </div>
      <div className="flex gap-3">
        <Select value={status} onValueChange={v => setStatus(v ?? '')}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={building} onValueChange={v => setBuilding(v ?? '')}>
          <SelectTrigger className="w-32"><SelectValue placeholder="All buildings" /></SelectTrigger>
          <SelectContent>
            {BUILDINGS.map(b => <SelectItem key={b} value={b}>{b || 'All'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <TicketTable tickets={tickets} />
    </div>
  )
}
