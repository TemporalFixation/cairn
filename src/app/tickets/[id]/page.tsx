'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TicketForm } from '@/components/tickets/TicketForm'
import Link from 'next/link'
import type { TicketWithRelations } from '@/types'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketWithRelations | null>(null)

  useEffect(() => {
    fetch(`/api/tickets/${id}`).then(r => r.json()).then(d => setTicket(d.ticket))
  }, [id])

  async function handleSave(data: any) {
    await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.refresh()
  }

  if (!ticket) return <p>Loading...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ticket — {ticket.issueType}</h1>
        <Link href={`/assets/${ticket.assetId}`} className="text-sm text-blue-600 hover:underline">
          View Asset ({ticket.asset.assetTag})
        </Link>
      </div>
      <TicketForm assetId={ticket.assetId} ticketId={id} onSave={handleSave} initialData={ticket} />
    </div>
  )
}
