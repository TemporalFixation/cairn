'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketTable } from '@/components/tickets/TicketTable'
import { TicketForm } from '@/components/tickets/TicketForm'
import { Modal } from '@/components/shared/Modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TicketWithRelations } from '@/types'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'WaitingForParts', label: 'Waiting for Parts' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
]
const BUILDINGS = ['', 'LPQ', 'MHS', 'BG', 'CC']

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketWithRelations[]>([])
  const [status, setStatus] = useState('')
  const [building, setBuilding] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (building) params.set('building', building)
    fetch(`/api/tickets?${params}`).then(r => r.json()).then(d => setTickets(d.tickets ?? []))
  }, [status, building])

  useEffect(() => { load() }, [load])

  async function handleSave(data: any) {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { ticket } = await res.json()
      setShowAdd(false)
      router.push(`/tickets/${ticket.id}`)
    } else {
      const err = await res.json().catch(() => ({}))
      alert(`Failed to create ticket: ${err.error ?? res.statusText}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Service</p>
          <h1 className="text-2xl font-semibold">Repair Tickets</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          + New Ticket
        </button>
      </div>

      <div className="flex gap-3">
        <Select value={status} onValueChange={v => setStatus(v ?? '')}>
          <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={building} onValueChange={v => setBuilding(v ?? '')}>
          <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="All buildings" /></SelectTrigger>
          <SelectContent>
            {BUILDINGS.map(b => <SelectItem key={b} value={b}>{b || 'All buildings'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <TicketTable tickets={tickets} />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Repair Ticket" width="max-w-2xl">
        <TicketForm onSave={handleSave} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
